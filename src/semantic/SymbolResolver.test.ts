import { AssignmentNode, ScadFile } from "..";
import { AssertExpr, LiteralExpr } from "../ast/expressions";
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
        expect(n.expr).toBeInstanceOf(ResolvedLookupExpr);
        return n;
      }
    }
    ast.accept(new A());
  });

  it("resolves local symbols in block statements, with correct shadowing", () => {
    let [ast, ec] = ParsingHelper.parseFile(
      new CodeFile(
        "<test>",
        `x = [10:20];
         {
           x = "correct";
           cincoman = assert(1==1) x;
         }
    `
      )
    );
    ec.throwIfAny();
    const pop = new ASTScopePopulator(new Scope());
    ast = ast.accept(pop) as ScadFile;
    const resolver = new SymbolResolver(ec);
    ast = ast.accept(resolver) as ScadFile;
    ec.throwIfAny();

    const confirmFn = jest.fn();

    class A extends ASTMutator {
      visitAssertExpr(n: AssertExpr) {
        confirmFn();
        expect(n.expr).toBeInstanceOf(ResolvedLookupExpr);
        expect(
          (n.expr as ResolvedLookupExpr).resolvedDeclaration
        ).toBeInstanceOf(AssignmentNode);
        expect(
          (n.expr as ResolvedLookupExpr).resolvedDeclaration.value
        ).toBeInstanceOf(LiteralExpr);
        expect(
          ((n.expr as ResolvedLookupExpr).resolvedDeclaration
            .value as LiteralExpr<string>).value
        ).toEqual("correct");
        return n;
      }
    }
    ast.accept(new A());
    expect(confirmFn).toHaveBeenCalled(); // make sure we have called the method which verifies this test
  });
});
