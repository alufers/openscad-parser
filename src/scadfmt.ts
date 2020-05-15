import CodeFile from "./CodeFile";
import ErrorCollector from "./ErrorCollector";
import Lexer from "./Lexer";
import Parser from "./Parser";
import ASTPrinter from "./ASTPrinter";
import Token from "./Token";
import FormattingConfiguration from "./FormattingConfiguration";

async function run() {
  const filename = process.argv[2];
  const file = await CodeFile.load(filename);
  const errorCollector = new ErrorCollector();
  const lexer = new Lexer(file, errorCollector);
  let tokens: Token[];
  try {
    tokens = lexer.scan();
  } catch (e) {}
  if (errorCollector.hasErrors()) {
    errorCollector.printErrors();
    process.exit(999);
  }
  let parser, ast;
  try {
    parser = new Parser(file, tokens, errorCollector);
    ast = parser.parse();
  } catch (e) {}
  if (errorCollector.hasErrors()) {
    errorCollector.printErrors();
    process.exit(999);
  }
  console.log(
    new ASTPrinter(new FormattingConfiguration()).visitScadFile(ast)
  );
}
run().catch(console.error);
