import ParsingHelper from "../ParsingHelper";
import CodeFile from "../CodeFile";
import ASTScopePopulator from "./ASTScopePopulator";
import Scope from "./Scope";

describe("ASTScopePopulator", () => {
  it("does not crash when populating code containing range expressions", () => {
    const [ast, ec] = ParsingHelper.parseFile(
      new CodeFile("<test>", "x = [10:20];")
    );
    ec.throwIfAny();
    const pop = new ASTScopePopulator(new Scope());
    ast.accept(pop);
  });
});
