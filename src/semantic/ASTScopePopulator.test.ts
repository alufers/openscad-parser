import ParsingHelper from "../ParsingHelper";
import CodeFile from "../CodeFile";
import ASTScopePopulator from "./ASTScopePopulator";
import Scope from "./Scope";
import * as path from "path";

describe("ASTScopePopulator", () => {
  it("does not crash when populating code containing range expressions", () => {
    const [ast, ec] = ParsingHelper.parseFile(
      new CodeFile("<test>", "x = [10:20];")
    );
    ec.throwIfAny();
    const pop = new ASTScopePopulator(new Scope());
    ast.accept(pop);
  });
  it("populates the scope with prelude functions", async () => {
    const [ast, ec] = ParsingHelper.parseFile(
      await CodeFile.load(path.join(__dirname, "../prelude/prelude.scad"))
    );
    ec.throwIfAny();
    const scope = new Scope();
    const pop = new ASTScopePopulator(scope);
    ast.accept(pop);
    // console.log(scope);
  });
});
