import ScadFileProvider from "./ScadFileProvider";
import ScadFile from "../ast/ScadFile";
import { UseStmt, IncludeStmt } from "../ast/statements";
import fs from "fs/promises";
import os from "os";
import * as path from "path";

export default class IncludeResolver {
  constructor(private provider: ScadFileProvider) {}
  /**
   * Finds all file includes and returns paths to them
   * @param f
   */
  async resolveIncludes(f: ScadFile) {
    const includes: string[] = [];
    for (const stmt of f.statements) {
      if (stmt instanceof IncludeStmt) {
        includes.push(
          await this.locateScadFile(f.pos.file.path, stmt.filename)
        );
      }
    }
    return Promise.all(includes.map(incl => this.provider.provideScadFile(incl)));
  }

  /**
   * Finds all file uses and returns paths to them
   * @param f
   */
  async resolveUses(f: ScadFile) {
    const uses: string[] = [];
    for (const stmt of f.statements) {
      if (stmt instanceof UseStmt) {
        uses.push(
          await this.locateScadFile(f.pos.file.path, stmt.filename)
        );
      }
    }
    return Promise.all(uses.map(incl => this.provider.provideScadFile(incl)));
  }

  async locateScadFile(parent: string, relativePath: string) {
    const searchDirs = [path.dirname(parent), ...IncludeResolver.includeDirs];
    for (const dir of searchDirs) {
      const resultingPath = path.resolve(dir, relativePath);
      try {
        if ((await fs.stat(resultingPath)).isFile()) {
          return resultingPath;
        }
      } catch (e) {}
    }
  }

  private static _includeDirsCache: string[] = null;

  static get includeDirs() {
    if (!this._includeDirsCache) {
      this._includeDirsCache = [];
      const ENV_SEP = os.platform() === "win32" ? ";" : ":";
      this._includeDirsCache.push(
        ...(process.env.OPENSCADPATH || "").split(ENV_SEP)
      );
      if (os.platform() === "win32") {
        // TODO: add my documents path
        // TODO: add installation directory
      }
      if (os.platform() === "linux") {
        this._includeDirsCache.push(
          path.join(os.homedir(), ".local/share/OpenSCAD/libraries")
        );
        this._includeDirsCache.push("/usr/share/openscad/libraries");
      }
      if (os.platform() === "darwin") {
        this._includeDirsCache.push(
          path.join(os.homedir(), "Documents/OpenSCAD/libraries")
        );
        //TODO: add installation directory
      }
    }
    return this._includeDirsCache;
  }
}
