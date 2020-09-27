import { ScadFile } from "..";
import { AssertExpr } from "../ast/expressions";
import ASTMutator from "../ASTMutator";
import CodeFile from "../CodeFile";
import ParsingHelper from "../ParsingHelper";
import ASTScopePopulator from "./ASTScopePopulator";
import { ResolvedLookupExpr } from "./resolvedNodes";
import Scope from "./Scope";
import SymbolResolver from "./SymbolResolver";

describe("SymbolResolver", () => {
  it("resolves local symbols in file top level", () => {
    let [ast, ec] = ParsingHelper.parseFile(
      new CodeFile(
        "<test>",
        `x = [10:20];
         cincoman = assert(1==1) x;
    `
      )
    );
    ec.throwIfAny();
    const pop = new ASTScopePopulator(new Scope());
    ast = ast.accept(pop) as ScadFile;
    const resolver = new SymbolResolver(ec);
    ast = ast.accept(resolver) as ScadFile;
    ec.throwIfAny();
    class A extends ASTMutator {
        visitAssertExpr(n: AssertExpr) {
            console.log(n)
            expect(n.expr).toBeInstanceOf(ResolvedLookupExpr)
            return n;
        }
    }
    ast.accept(new A());
  });
});
