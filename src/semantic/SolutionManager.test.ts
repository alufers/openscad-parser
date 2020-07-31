import SolutionManager, { SolutionFile } from "../SolutionManager";
import { promises as fs } from "fs";
import { join } from "path";
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
});
