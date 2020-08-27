import CompletionProvider from "./CompletionProvider";
import { ASTNode, CodeLocation } from "..";
import CompletionSymbol from "./CompletionSymbol";
import * as path from "path";
import { promises as fs } from "fs";
import CompletionType from "./CompletionType";
import IncludeResolver from "./IncludeResolver";
export default class FilenameCompletionProvider implements CompletionProvider {
  textOnly = true;
  exclusive = true;
  /**
   * Determines whether we are in a include<> or use<> statement
   * @param ast
   * @param loc
   */
  shouldActivate(ast: ASTNode, loc: CodeLocation): boolean {
    return this.getExistingPath(ast, loc) != null;
  }

  async getSymbolsAtLocation(
    ast: ASTNode,
    loc: CodeLocation
  ): Promise<CompletionSymbol[]> {
    const existingPath = this.getExistingPath(ast, loc);
    let searchDirs: string[] = [];
    if (path.isAbsolute(existingPath)) {
      searchDirs = [path.dirname(existingPath)];
    } else {
      searchDirs = IncludeResolver.includeDirs.map((id) =>
        path.join(id, path.dirname(existingPath))
      );
    }
    let output: CompletionSymbol[] = [];
    for (const sd of searchDirs) {
      const filenames = (await fs.readdir(sd)).filter((p) =>
        p.startsWith(path.basename(existingPath))
      );

      output = [
        ...output,
        ...(
          await Promise.all(
            filenames.map(async (f) => {
              const stat = await fs.stat(path.join(sd, f));
              if (stat.isDirectory()) {
                return new CompletionSymbol(CompletionType.DIRECTORY, f);
              }
              if (stat.isFile() && f.endsWith(".scad")) {
                return new CompletionSymbol(CompletionType.FILE, f);
              }
              return null;
            })
          )
        ).filter((s) => !!s),
      ];
    }

    return output;
  }

   getExistingPath(ast: ASTNode, loc: CodeLocation): string {
    let charPos = loc.char;
    let linesLimit = 5;
    let stage = 0;
    let existingFilename = "";
    while (true) {
      if (charPos <= 0 || linesLimit <= 0) {
        return null;
      }
      const char = loc.file.code[charPos];
      if (char === "\n") {
        linesLimit--;
      }
      if (char === ">") {
        return null;
      }
      if (stage === 0 && char === "<") {
        stage++;
        existingFilename = loc.file.code.substring(charPos + 1, loc.char + 1);
      } else if (
        stage === 1 &&
        char !== " " &&
        char !== "\t" &&
        char !== "\r" &&
        char !== "\n"
      ) {
        if (
          loc.file.code.substring(charPos - "use".length + 1, charPos + 1) ===
          "use"
        ) {
          return existingFilename;
        }
        if (
          loc.file.code.substring(
            charPos - "include".length + 1,
            charPos + 1
          ) === "include"
        ) {
          return existingFilename;
        }
        return null;
      }

      charPos--;
    }
    return null;
  }
}
