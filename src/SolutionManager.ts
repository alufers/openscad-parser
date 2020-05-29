import CodeFile from "./CodeFile";
import ASTNode from "./ast/ASTNode";
import * as path from "path";
import ParsingHelper from "./ParsingHelper";
import ASTScopePopulator from "./semantic/ASTScopePopulator";
import Scope from "./semantic/Scope";
import CompletionUtil from "./semantic/CompletionUtil";

import ASTSymbolLister, { SymbolKind } from "./semantic/ASTSymbolLister";
import Range from "./Range";
import ASTPrinter from "./ASTPrinter";
import CodeLocation from "./CodeLocation";
import ScadFile from "./ast/ScadFile";
import FormattingConfiguration from "./FormattingConfiguration";


export class SolutionFile {
  fullPath: string;
  codeFile: CodeFile;
  ast: ASTNode = null;
  dependencies: SolutionFile[];
  errors: Error[];

  parseAndProcess() {
    let [ast, errors] = ParsingHelper.parseFile(this.codeFile);
    this.errors = errors.errors;
    this.ast = new ASTScopePopulator(new Scope()).populate(ast);
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
}

export default class SolutionManager {
  openedFiles: Map<string, SolutionFile> = new Map();
  allFiles: Map<string, SolutionFile> = new Map();
  getFile(filePath: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    return this.allFiles.get(filePath);
  }
  notifyNewFileOpened(filePath: string, contents: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    const cFile = new CodeFile(filePath, contents);

    this.openedFiles.set(filePath, this.attachSolutionFile(cFile));
  }
  notifyFileChanged(filePath: string, contents: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error("Path must be absolute and normalized.");
    }
    const cFile = new CodeFile(filePath, contents);
    const sf = this.openedFiles.get(filePath);
    if (!sf) {
      throw new Error("No such file");
    }
    sf.codeFile = cFile;
    sf.parseAndProcess();
  }
  notifyFileClosed(filePath: string, contents: string) {
    this.openedFiles.delete(filePath);
    this.garbageCollect();
  }
  protected attachSolutionFile(codeFile: CodeFile) {
    const solutionFile = new SolutionFile();
    solutionFile.codeFile = codeFile;
    solutionFile.parseAndProcess();
    this.allFiles.set(codeFile.path, solutionFile);
    return solutionFile;
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
