import * as path from "path";
import ASTNode from "./ast/ASTNode";
import ScadFile from "./ast/ScadFile";
import ASTPrinter from "./ASTPrinter";
import CodeFile from "./CodeFile";
import CodeLocation from "./CodeLocation";
import FormattingConfiguration from "./FormattingConfiguration";
import ParsingHelper from "./ParsingHelper";
import Range from "./Range";
import ASTScopePopulator from "./semantic/ASTScopePopulator";
import ASTSymbolLister, { SymbolKind } from "./semantic/ASTSymbolLister";
import CompletionUtil from "./semantic/CompletionUtil";
import Scope from "./semantic/Scope";
import ScadFileProvider, {
  WithExportedScopes,
} from "./semantic/ScadFileProvider";
import { ScadFileWithScope } from "./semantic/nodesWithScopes";
import IncludeResolver from "./semantic/IncludeResolver";
import PreludeUtil from "./prelude/PreludeUtil";

export class SolutionFile implements WithExportedScopes {
  fullPath: string;
  codeFile: CodeFile;
  ast: ASTNode = null;
  dependencies: SolutionFile[];
  errors: Error[];
  includeResolver: IncludeResolver<SolutionFile>;

  includedFiles: SolutionFile[];

  onlyOwnScope: Scope;

  constructor(public solutionManager: SolutionManager) {
    this.includeResolver = new IncludeResolver(this.solutionManager);
  }

  async parseAndProcess() {
    let [ast, errors] = ParsingHelper.parseFile(this.codeFile);
    if (ast) {
      this.ast = new ASTScopePopulator(new Scope()).populate(ast);
      this.includedFiles = await this.includeResolver.resolveIncludes(
        this.ast as ScadFile,
        errors
      );
      const usedFiles = await this.includeResolver.resolveIncludes(
        this.ast as ScadFile,
        errors
      );
      this.dependencies = [...this.includedFiles, ...usedFiles];
      this.onlyOwnScope = (this.ast as ScadFileWithScope).scope.copy();
      (this.ast as ScadFileWithScope).scope.siblingScopes = [
        ...this.includedFiles.map((f) => f.getExportedScopes()).flat(),
        ...usedFiles.map((f) => f.getExportedScopes()).flat(),
        PreludeUtil.preludeScope,
      ];
    }
    this.errors = errors.errors;
  }
  getCompletionsAtLocation(loc: CodeLocation) {
    return CompletionUtil.getSymbolsAtLocation(this.ast, loc);
  }

  getSymbols<SymType>(
    makeSymbol: (
      name: string,
      kind: SymbolKind,
      fullRange: Range,
      nameRange: Range,
      children: SymType[]
    ) => SymType
  ) {
    const l = new ASTSymbolLister<SymType>(makeSymbol);
    return l.doList(this.ast);
  }

  getFormatted() {
    return new ASTPrinter(new FormattingConfiguration()).visitScadFile(
      this.ast as ScadFile
    );
  }
  getExportedScopes(): Scope[] {
    return [
      this.onlyOwnScope,
      ...this.includedFiles.map((f) => f.getExportedScopes()).flat(),
    ];
  }
}

export default class SolutionManager implements ScadFileProvider<SolutionFile> {
  openedFiles: Map<string, SolutionFile> = new Map();
  allFiles: Map<string, SolutionFile> = new Map();
  notReadyFiles: Map<string, Promise<SolutionFile>> = new Map();
  /**
   * Returns a registered solution file for a given path. It supports getting files which have not been fully processed yet.
   * @param filePath
   */
  async getFile(filePath: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    let file = this.allFiles.get(filePath);
    if (file) {
      return file;
    }
    return await this.notReadyFiles.get(filePath);
  }
  async notifyNewFileOpened(filePath: string, contents: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    const cFile = new CodeFile(filePath, contents);

    this.openedFiles.set(filePath, await this.attachSolutionFile(cFile));
  }
  async notifyFileChanged(filePath: string, contents: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    const cFile = new CodeFile(filePath, contents);
    let sf = this.openedFiles.get(filePath);
    if (!sf) {
      if (this.notReadyFiles.has(filePath)) {
        sf = await this.notReadyFiles.get(filePath);
      } else {
        throw new Error("No such file");
      }
    }
    sf.codeFile = cFile;
    await sf.parseAndProcess();
  }
  notifyFileClosed(filePath: string) {
    this.openedFiles.delete(filePath);
    this.garbageCollect();
  }
  protected async attachSolutionFile(codeFile: CodeFile) {
    const solutionFile = new SolutionFile(this);
    solutionFile.codeFile = codeFile;
    try {
      let resolve: (s: SolutionFile) => void;
      this.notReadyFiles.set(
        codeFile.path,
        new Promise<SolutionFile>((r) => (resolve = r))
      );
      await solutionFile.parseAndProcess();
      resolve(solutionFile);
      this.allFiles.set(codeFile.path, solutionFile);
      return solutionFile;
    } finally {
      this.notReadyFiles.delete(codeFile.path);
    }
  }
  /**
   * Checks whether a file is already in the solution, and if not it loads it from disk.
   * @param filePath The dependent-upon file.
   */
  async provideScadFile(filePath: string) {
    let f = this.getFile(filePath);
    if (f) return f; // the file is already opened or refrenced by antoher
    return await this.attachSolutionFile(await CodeFile.load(filePath));
  }
  /**
   * Removes dependencies that aren't directly or indirectly referenced in any of the open files to free memory.
   */
  protected garbageCollect() {
    const gcMarked = new WeakMap<SolutionFile, boolean>();
    function markRecursive(f: SolutionFile) {
      gcMarked.set(f, true);
      for (const dep of f.dependencies) {
        if (!gcMarked.has(dep)) {
          markRecursive(dep);
        }
      }
    }
    for (const [_, dep] of this.openedFiles) {
      markRecursive(dep);
    }
    for (const [path, f] of this.allFiles) {
      if (!gcMarked.has(f)) {
        this.allFiles.delete(path);
      }
    }
  }
}
