import ASTPrinter from "./ASTPrinter";
import CodeFile from "./CodeFile";
import FormattingConfiguration from "./FormattingConfiguration";
import ParsingHelper from "./ParsingHelper";

async function run() {
  const filename = process.argv[2];
  const file = await CodeFile.load(filename);
  const [ast, errorCollector] = ParsingHelper.parseFile(file);
  if (errorCollector.hasErrors()) {
    errorCollector.printErrors();
    process.exit(999);
  }
  console.log(new ASTPrinter(new FormattingConfiguration()).visitScadFile(ast));
}
run().catch(console.error);
