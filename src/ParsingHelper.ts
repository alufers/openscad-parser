import {
  CodeFile,
  Lexer,
  ErrorCollector,
  Token,
  Parser,
  ASTPrinter,
  FormattingConfiguration,
  ScadFile,
} from ".";

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
      return [null, errorCollector];
    }
    return [ast, errorCollector];
  }
}
