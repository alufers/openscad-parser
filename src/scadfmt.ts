import CodeFile from "./CodeFile";
import Lexer from "./Lexer";
import Parser from "./Parser";
import { runInContext } from "vm";
import SimpleASTPrinter from "./SimpleASTPrinter";

async function run() {
  const filename = process.argv[2];
  const file = await CodeFile.load(filename);
  const lexer = new Lexer(file);
  const parser = new Parser(file, lexer.scan());
  console.log(new SimpleASTPrinter().visitScadFile(parser.parse()));
}
run().catch(console.error);
