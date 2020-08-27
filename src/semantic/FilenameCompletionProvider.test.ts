import CodeFile from "../CodeFile";
import FilenameCompletionProvider from "./FilenameCompletionProvider";
import ParsingHelper from "../ParsingHelper";
import CodeLocation from "../CodeLocation";
import { off } from "process";

describe("FilenameCompletionProvider.test", () => {
  describe("shouldActivate", () => {
    const isInFilename = (code: string, offset: number) => {
      const cf = new CodeFile("/test/ddd", code);
      const [ast, ec] = ParsingHelper.parseFile(cf);

      const fcp = new FilenameCompletionProvider();
      return fcp.shouldActivate(ast, new CodeLocation(cf, offset, 0, 0));
    };
    it("does not activate when not inside of a filename", () => {
      expect(isInFilename(`a = 10`, 3)).toBeFalsy();
      expect(isInFilename(`<a = 10>`, 3)).toBeFalsy();
      expect(
        isInFilename(
          `use <dupa>
      a = b
      `,
          14
        )
      ).toBeFalsy();
    });
    it("does activate when not inside of a filename", () => {
      expect(isInFilename(`use <theFIle`, 7)).toBeTruthy();
      expect(isInFilename(`use <theFIle>`, 7)).toBeTruthy();
      expect(isInFilename(`use 
      
      <theFIle>`, 23)).toBeTruthy();
      expect(isInFilename(`include <theFIle>`, 8)).toBeTruthy();
      expect(isInFilename(`a+b+c;include <theFIle>`, 16)).toBeTruthy();
    });
  });
});
