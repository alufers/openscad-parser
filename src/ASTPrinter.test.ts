import CodeFile from "./CodeFile";
import ASTPrinter from "./ASTPrinter";
import ParsingHelper from "./ParsingHelper";
import FormattingConfiguration from "./FormattingConfiguration";
import Lexer from "./Lexer";
import ErrorCollector from "./ErrorCollector";
import TokenType from "./TokenType";
import AssignmentNode from "./ast/AssignmentNode";
import { VectorExpr } from "./ast/expressions";

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

    const formatted = doFormat(codeWithInjections);
    for (const inj of injectedStrings) {
      expect(formatted).toEqual(expect.stringContaining(inj));
    }
  }

  test.skip("it preserves all comments in a file with all the syntactical elements", () => {
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
  test("it preserves all comments nearby vectors with trailing comments", () => {
    doPreserveTest(`
      a = [d,];
    `);
  });
});
