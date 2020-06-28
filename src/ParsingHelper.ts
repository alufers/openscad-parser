import ScadFile from "./ast/ScadFile";
import CodeFile from "./CodeFile";
import ErrorCollector from "./ErrorCollector";
import Lexer from "./Lexer";
import Parser from "./Parser";
import Token from "./Token";

export default class ParsingHelper {
  static parseFile(f: CodeFile): [ScadFile | null, ErrorCollector] {
    const errorCollector = new ErrorCollector();
    const lexer = new Lexer(f, errorCollector);
    let tokens: Token[];
    try {
      tokens = lexer.scan();
    } catch (e) {}
    if (errorCollector.hasErrors()) {
      return [null, errorCollector];
    }
    let parser = new Parser(f, tokens, errorCollector);
    let ast: ScadFile = null;
    try {
      ast = parser.parse();
    } catch (e) {}
    if (errorCollector.hasErrors()) {
      return [ast, errorCollector];
    }
    return [ast, errorCollector];
  }
}
