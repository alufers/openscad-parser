import { readFileSync } from "fs";
import { join } from "path";
import ScadFile from "../ast/ScadFile";
import CodeFile from "../CodeFile";
import ParsingHelper from "../ParsingHelper";
import ASTScopePopulator from "../semantic/ASTScopePopulator";
import Scope from "../semantic/Scope";

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
