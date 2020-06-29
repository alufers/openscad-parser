import ASTNode from "../ast/ASTNode";
import ASTPinpointer from "../ASTPinpointer";
import CodeLocation from "../CodeLocation";
import NodeWithScope from "./NodeWithScope";
import Scope from "./Scope";
import keywords from "../keywords";

export enum CompletionType {
  VARIABLE,
  FUNCTION,
  MODULE,
  KEYWORD,
}

export class CompletionSymbol {
  constructor(public type: CompletionType, public name: string) {}
}

export default class CompletionUtil {
  static getSymbolsAtLocation(ast: ASTNode, loc: CodeLocation) {
    const pp = new ASTPinpointer(loc);
    pp.doPinpoint(ast);
    let symbols: CompletionSymbol[] = [];
    const scopesToShow: Scope[] = [];
    for (const h of pp.bottomUpHierarchy) {
      const hh: NodeWithScope = h as NodeWithScope;
      if ("scope" in hh && hh.scope instanceof Scope) {
        scopesToShow.push(hh.scope);
        scopesToShow.push(...hh.scope.siblingScopes);
      }
    }
    for (const scope of scopesToShow) {
      for (const v of scope.variables) {
        symbols.push(new CompletionSymbol(CompletionType.VARIABLE, v[1].name));
      }
      for (const f of scope.functions) {
        symbols.push(new CompletionSymbol(CompletionType.FUNCTION, f[1].name));
      }
      for (const m of scope.modules) {
        symbols.push(new CompletionSymbol(CompletionType.MODULE, m[1].name));
      }
    }
    symbols.push(
      ...Object.keys(keywords).map(
        (kwrd) => new CompletionSymbol(CompletionType.KEYWORD, kwrd)
      )
    );
    return symbols;
  }
}
