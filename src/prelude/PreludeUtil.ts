import Scope from "../semantic/Scope";
import ParsingHelper from "../ParsingHelper";
import CodeFile from "../CodeFile";
import { join } from "path";
import { readFileSync } from "fs";
import ASTScopePopulator from "../semantic/ASTScopePopulator";
import ScadFile from "../ast/ScadFile";

export default class PreludeUtil {
  private static _cachedPreludeScope: Scope = null;
  public static get preludeScope() {
    if (!this._cachedPreludeScope) {
      const preludeLocation = join(__dirname, "prelude.scad");
      let [ast] = ParsingHelper.parseFile(
        new CodeFile(preludeLocation, readFileSync(preludeLocation, "utf8"))
      );
      this._cachedPreludeScope = new Scope();
      const pop = new ASTScopePopulator(this._cachedPreludeScope);
      ast = ast.accept(pop) as ScadFile;
    }

    return this._cachedPreludeScope;
  }
}
