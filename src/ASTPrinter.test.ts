import CodeFile from "./CodeFile";
import ASTPrinter from "./ASTPrinter";
import ParsingHelper from "./ParsingHelper";
import FormattingConfiguration from "./FormattingConfiguration";
import Lexer from "./Lexer";
import ErrorCollector from "./ErrorCollector";
import TokenType from "./TokenType";
import AssignmentNode from "./ast/AssignmentNode";
import { VectorExpr } from "./ast/expressions";
import { resolve } from "path";

describe("ASTPrinter", () => {
  function doFormat(source: string) {
    const [ast, errorCollector] = ParsingHelper.parseFile(
      new CodeFile("<test>", source)
    );
    errorCollector.throwIfAny();
    return new ASTPrinter(new FormattingConfiguration()).visitScadFile(ast);
  }
  function injectCommentsBetweenTokens(source: string): [string, string[]] {
    const lexer = new Lexer(
      new CodeFile("<test>", source),
      new ErrorCollector()
    );
    const tokens = lexer.scan();
    let injectId = 0;
    const injectedStrings: string[] = [];
    let codeWithInjections = "";
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      let shouldInject = true;

      // do not inject comments around the use statement since it is illegal
      if (
        tok.type === TokenType.Use ||
        (i != 0 && tokens[i - 1].type === TokenType.Use)
      ) {
        shouldInject = false;
      }
      if (shouldInject) {
        const injectionBefore = `/* INJ_${injectId}_B */`;
        codeWithInjections += injectionBefore;
        injectedStrings.push(injectionBefore);
        injectId++;
      }
      codeWithInjections += tok.lexeme;
      if (shouldInject) {
        const injectionAfter = `/* INJ_${injectId}_A */`;
        codeWithInjections += injectionAfter;
        injectedStrings.push(injectionAfter);
        injectId++;
      }
    }
    return [codeWithInjections, injectedStrings];
  }

  function doPreserveTest(source: string) {
    const [codeWithInjections, injectedStrings] = injectCommentsBetweenTokens(
      source
    );

    // we do two passes, one with all the comments and another one with the problematic ones, this is where we throw errors
    const formatted = doFormat(codeWithInjections);
    let problematicCode = codeWithInjections;
    let problematicInjections: string[] = [];
    for (const inj of injectedStrings) {
      if (formatted.indexOf(inj) !== -1) {
        // the injection exists in the formatted code se we remove it
        problematicCode = problematicCode.replace(inj, " ");
      } else {
        problematicInjections.push(inj);
      }
    }
    const problematicFormatted = doFormat(problematicCode);
    if (problematicInjections.length > 0) console.log(problematicCode);
    for (const prob of problematicInjections) {
      expect(problematicFormatted).toEqual(expect.stringContaining(prob));
    }
  }

  test("it preserves all comments in a file with all the syntactical elements", () => {
    doPreserveTest(`
    use <ddd>
    function ddd(argv = 10, second = !true) = (10 + 20) * 10;
    ybyby = x > 10 ? let(v = 200) doSomething() : assert(x = 20) echo("nothing") 5;
    arr = [20, if(true) each [20:50:30] else [808][0].x];
    compre = [for(a = [rang1, 2, 3]) let(x = a + 1) [sin(a)],];
    module the_mod() {
        echo( [for (a = 0, b = 1;a < 5;a = a + 1, b = b + 2) [ a, b * b ] ] );
        if(yeah == true) {
            ;
        } else {

        }
    }
    `);
  });
  test("it preserves all comments nearby an use statement", () => {
    doPreserveTest(`
      use <ddd>
      
    `);
  });
  test("it preserves all comments nearby vectors", () => {
    doPreserveTest(`
      a = [d,];
    `);
    doPreserveTest(`
      a = [d,a,b];
    `);
    doPreserveTest(`
      a = [d];
    `);
  });
  test("it preserves all comments nearby list comprehensions with a for", () => {
    doPreserveTest(`
    compre = [for(a = [rang1, 2, 3]) x ];
    `);
  });

  test.skip("it preserves comments in ddd.scad", async () => {
    doPreserveTest(
      (await CodeFile.load(resolve(__dirname, "testdata/ddd.scad"))).code
    );
  });
  test("it does not add a space between the closing paren and semicolon in an empty module", () => {
    const f = doFormat(`module asdf();`);

    expect(f).not.toStrictEqual(expect.stringContaining(") ;"));
  });
  test("does not cutt off end chevron of an use statement", () => {
    const f = doFormat(`use <xD>`);

    expect(f).toStrictEqual(expect.stringContaining("<xD>"));
  });
});
