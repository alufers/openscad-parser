import ParsingHelper from "../ParsingHelper";
import ASTScopePopulator from "./ASTScopePopulator";
import Scope from "./Scope";
import ASTPrinter from "../ASTPrinter";
import CompletionUtil from "./CompletionUtil";
import ScadFile from "../ast/ScadFile";
import CodeLocation from "../CodeLocation";
import CodeFile from "../CodeFile";

describe("CompletionUtil", () => {
  function doComplete(source: string, charOffset: number) {
    let [ast, errorCollector] = ParsingHelper.parseFile(
      new CodeFile("<test>", source)
    );
    errorCollector.throwIfAny();
    ast = new ASTScopePopulator(new Scope()).populate(ast) as ScadFile; // populating the scopes should not change anything
    return CompletionUtil.getSymbolsAtLocation(
      ast,
      new CodeLocation(ast.pos.file, charOffset)
    );
  }
  it("provides completions in the global scope, at the end of the file", () => {
    const s = `
      the_var = 10;

    `;
    const results = doComplete(s, s.length - 1);
    expect(results.length).toBeGreaterThan(0);
    expect(results.find((r) => r.name === "the_var")).toBeTruthy();
  });
});
