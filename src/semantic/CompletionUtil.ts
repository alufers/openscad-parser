import ASTNode from "../ast/ASTNode";
import CodeLocation from "../CodeLocation";
import ASTPinpointer from "../ASTPinpointer";
import Scope from "./Scope";
import { NodeWithScope } from "..";

export enum CompletionType {
  VARIABLE,
  FUNCTION,
  MODULE,
}

export class CompletionSymbol {
  constructor(public type: CompletionType, public name: string) {}
}

export default class CompletionUtil {
  static getSymbolsAtLocation(ast: ASTNode, loc: CodeLocation) {
    const pp = new ASTPinpointer(loc);
    pp.doPinpoint(ast);
    let symbols: CompletionSymbol[] = [];
    for (const h of pp.bottomUpHierarchy) {
      const hh: NodeWithScope = h as NodeWithScope;
      if ("scope" in hh && hh.scope instanceof Scope) {
        for (const v of hh.scope.variables) {
          symbols.push(
            new CompletionSymbol(CompletionType.VARIABLE, v[1].name)
          );
        }
      }
    }
  }
}
