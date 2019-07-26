import Lexer from "./Lexer";
import CodeFile from "./CodeFile";
import Parser from "./Parser";
import { UseStmt } from "./ast/statements";
import ParsingError from "./ParsingError";

describe("Parser", () => {
  function doParse(source: string) {
    const l = new Lexer(new CodeFile("<test>", source));
    const parser = new Parser(l.codeFile, l.scan());
    return parser.parse();
  }
  it("parses basic use statements", () => {
    const scadFile = doParse(`
    use <myfile.scad>
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(UseStmt);
    expect((scadFile.statements[0] as UseStmt).filename).toEqual("myfile.scad");
  });
  it("parses use statements with spaces and weird symbols in the path", () => {
    const scadFile = doParse(`
    use <000988 eeeee 13-2/../92_3333.scad>
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(UseStmt);
    expect((scadFile.statements[0] as UseStmt).filename).toEqual(
      "000988 eeeee 13-2/../92_3333.scad"
    );
  });
  it("throws on unterminated use statements", () => {
    expect(() =>
      doParse(`
    use <ty
    `)
    ).toThrow(ParsingError);
  });
});
