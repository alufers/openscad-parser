import SolutionManager, { SolutionFile } from "../SolutionManager";
import { promises as fs } from "fs";
import { join } from "path";
import {
  ASTMutator,
  ModuleInstantiationStmt,
  ModuleInstantiationStmtWithScope,
  ResolvedModuleInstantiationStmt,
} from "..";
describe("SolutionManager", () => {
  it("returns files after they have fully processed when using getFile", async () => {
    const sm = new SolutionManager();
    const path = join(__dirname, "../testdata/includes/file.scad");
    await sm.notifyNewFileOpened(
      path,
      await fs.readFile(path, { encoding: "utf8" })
    );

    expect(await sm.getFile(path)).toBeInstanceOf(SolutionFile);
  });
  it("returns files before they have fully processed when using getFile", async () => {
    const sm = new SolutionManager();
    const path = join(__dirname, "../testdata/includes/file.scad");
    sm.notifyNewFileOpened(path, await fs.readFile(path, { encoding: "utf8" }));

    expect(await sm.getFile(path)).toBeInstanceOf(SolutionFile);
  });
  it("keeps ResolvedModuleInstantiationStmt in a test file", async () => {
    const sm = new SolutionManager();
    const path = join(
      __dirname,
      "../testdata/resolver_solution_manager_test.scad"
    );
    await sm.notifyNewFileOpened(
      path,
      await fs.readFile(path, { encoding: "utf8" })
    );

    const file = await sm.getFile(path);
    const spy = jest.fn();
    class Walker extends ASTMutator {
      visitModuleInstantiationStmt(node: ModuleInstantiationStmt) {
        expect(node).toBeInstanceOf(ResolvedModuleInstantiationStmt);

        spy();
        return node;
      }
    }
    if (!file?.ast) {
      throw new Error("File has no ast");
    }
    file.ast.accept(new Walker());

    expect(spy).toHaveBeenCalled();
  });

  async function checkNoError(filePath: string) {
    const sm = new SolutionManager();
    const path = join(__dirname, filePath);
    sm.notifyNewFileOpened(path, await fs.readFile(path, { encoding: "utf8" }));
    const sf = await sm.getFile(path);
    expect(sf).toBeInstanceOf(SolutionFile);
    expect(sf?.errors).toHaveLength(0);
  }

  it("does not report errors on 'echo' statements", async () => {
    await checkNoError("../testdata/echo_test.scad");
  });
  it("does not report errors on the 'render()' module", async () => {
    await checkNoError("../testdata/render_test.scad");
  })
  it('does report error when using an unknwon module', async () => {
    const sm = new SolutionManager();
    const path = join(__dirname, "../testdata/unknown_module.scad");
    sm.notifyNewFileOpened(path, await fs.readFile(path, { encoding: "utf8" }));
    const sf = await sm.getFile(path);
    expect(sf).toBeInstanceOf(SolutionFile);
    expect(sf?.errors).toHaveLength(1);
  });
});
