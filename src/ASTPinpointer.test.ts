import CodeFile from "./CodeFile";
import ASTPinpointer, { BinBefore, BinAfter } from "./ASTPinpointer";
import CodeLocation from "./CodeLocation";
import { LiteralExpr, LookupExpr } from "./ast/expressions";
import ErrorCollector from "./ErrorCollector";
import Lexer from "./Lexer";
import AssignmentNode from "./ast/AssignmentNode";
import ParsingHelper from "./ParsingHelper";
import Token from "./Token";
import { ScadFile } from ".";

describe("ASTPinpointer", () => {
  it("the internal binsearch dispatch works with simple tokens", () => {
    const f = new CodeFile("<test>", "a=5;b=a;");
    const ec = new ErrorCollector();

    const lexer = new Lexer(f, ec);
    const tokens = lexer.scan();
    ec.throwIfAny();
    class TstClass extends ASTPinpointer {
      testFunc1() {
        return this.binSearchDispatch([tokens[1], tokens[2]], null);
      }
    }
    const p = new TstClass(new CodeLocation(f, 1));
    expect(p.testFunc1()).toEqual(BinBefore);

    p.pinpointLocation = new CodeLocation(f, 200);
    expect(p.testFunc1()).toEqual(BinAfter);

    p.pinpointLocation = new CodeLocation(f, 2);
    expect(p.testFunc1()).toEqual(null);
  });
  it("the internal binsearch dispatch works with function trees", () => {
    const f = new CodeFile("<test>", "a=5;b=a;");
    const ec = new ErrorCollector();

    const lexer = new Lexer(f, ec);
    const tokens = lexer.scan();
    ec.throwIfAny();
    class TstClass extends ASTPinpointer {
      testFunc1() {
        return this.binSearchDispatch(
          [
            () =>
              this.binSearchDispatch(
                [
                  tokens[0],
                  tokens[1],
                  () =>
                    this.binSearchDispatch(
                      [tokens[2]],
                      new (LiteralExpr as any)()
                    ),
                  tokens[3],
                ],
                new (AssignmentNode as any)()
              ),
            () =>
              this.binSearchDispatch(
                [
                  tokens[4],
                  tokens[5],
                  () =>
                    this.binSearchDispatch(
                      [tokens[6]],
                      new (LiteralExpr as any)()
                    ),
                  tokens[7],
                ],
                new (AssignmentNode as any)()
              ),
          ],
          new (ScadFile as any)()
        );
      }
    }
    const p = new TstClass(new CodeLocation(f, 1));
    expect(p.testFunc1()).toBeInstanceOf(AssignmentNode);

    p.pinpointLocation = new CodeLocation(f, 200);
    expect(p.testFunc1()).toEqual(BinAfter);

    p.pinpointLocation = new CodeLocation(f, 2);
    expect(p.testFunc1()).toBeInstanceOf(AssignmentNode);
    p.pinpointLocation = new CodeLocation(f, 3);
    expect(p.testFunc1()).toBeInstanceOf(LiteralExpr);
    p.pinpointLocation = new CodeLocation(f, 4);
    expect(p.testFunc1()).toBeInstanceOf(AssignmentNode);
  });
  it("pinpoints nodes in a simple assignment expression", () => {
    const f = new CodeFile("<test>", "a=5;b=a;");
    //                                12345678

    const [ast, ec] = ParsingHelper.parseFile(f);
    ec.throwIfAny();
    const ap = new ASTPinpointer(new CodeLocation(f, 1));
    let theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(AssignmentNode);
    ap.pinpointLocation = new CodeLocation(f, 3);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(LiteralExpr);
    ap.pinpointLocation = new CodeLocation(f, 4);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(AssignmentNode);
    ap.pinpointLocation = new CodeLocation(f, 5);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(AssignmentNode);
    ap.pinpointLocation = new CodeLocation(f, 6);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(AssignmentNode);
    ap.pinpointLocation = new CodeLocation(f, 7);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(LookupExpr);
    ap.pinpointLocation = new CodeLocation(f, 8);
    theNode = ap.doPinpoint(ast);
    expect(theNode).toBeInstanceOf(AssignmentNode);
  });
  it
});
