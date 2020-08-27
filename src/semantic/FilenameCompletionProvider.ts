import CompletionProvider from "./CompletionProvider";
import { ASTNode, CodeLocation } from "..";
import CompletionSymbol from "./CompletionSymbol";

export default class FilenameCompletionProvider implements CompletionProvider {
  textOnly = true;
  exclusive = true;
  /**
   * Determines whether we are in a include<> or use<> statement
   * @param ast
   * @param loc
   */
  shouldActivate(ast: ASTNode, loc: CodeLocation): boolean {
    let charPos = loc.char;
    let linesLimit = 5;
    let stage = 0;
    while (true) {
      if (charPos <= 0 || linesLimit <= 0) {
        return false;
      }
      const char = loc.file.code[charPos];
      if (char === "\n") {
        linesLimit--;
      }
      if (char === ">") {
        return false;
      }
      if (stage === 0 && char === "<") {
        stage++;
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
          return true;
        }
        if (
          loc.file.code.substring(
            charPos - "include".length + 1,
            charPos + 1
          ) === "include"
        ) {
          return true;
        }
        return false;
      }

      charPos--;
    }
  }
  getSymbolsAtLocation(ast: ASTNode, loc: CodeLocation): CompletionSymbol {
    throw new Error("Method not implemented.");
  }
}
