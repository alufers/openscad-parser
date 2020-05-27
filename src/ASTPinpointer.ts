import ASTVisitor from "./ast/ASTVisitor";
import ASTNode from "./ast/ASTNode";
import AssignmentNode from "./ast/AssignmentNode";
import {
  ArrayLookupExpr,
  AssertExpr,
  BinaryOpExpr,
  EchoExpr,
  FunctionCallExpr,
  GroupingExpr,
  LcEachExpr,
  LcForCExpr,
  LcForExpr,
  LcIfExpr,
  LcLetExpr,
  LetExpr,
  LiteralExpr,
  LookupExpr,
  MemberLookupExpr,
  RangeExpr,
  TernaryExpr,
  UnaryOpExpr,
  VectorExpr,
} from "./ast/expressions";
import ScadFile from "./ast/ScadFile";
import {
  BlockStmt,
  FunctionDeclarationStmt,
  IfElseStatement,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
  NoopStmt,
  UseStmt,
  Statement,
} from "./ast/statements";
import {
  MultiLineComment,
  NewLineExtraToken,
  SingleLineComment,
} from "./extraTokens";
import Token from "./Token";
import TokenType from "./TokenType";
import FormattingConfiguration from "./FormattingConfiguration";
import ErrorNode from "./ast/ErrorNode";
import CodeLocation from "./CodeLocation";
import ASTAssembler from "./ASTAssembler";

export const BinAfter = Symbol("BinAfter");
export const BinBefore = Symbol("BinBefore");

type PinpointerRet = ASTNode | typeof BinAfter | typeof BinBefore;

type DispatchTokenMix = (Token | (() => PinpointerRet))[];

/**
 * This class searches through the AST to find a node based on its position.
 * It may return BinAfter or BinBefore if the node cannot be found.
 */
export default class ASTPinpointer extends ASTAssembler<PinpointerRet>
  implements ASTVisitor<PinpointerRet> {
  constructor(public pinpointLocation: CodeLocation) {
    super();
  }
  /**
   * Returns the node at pinpointLocation and populates bottomUpHierarchy.
   * @param n The AST (or AST fragment) to search through.
   */
  doPinpoint(n: ASTNode): PinpointerRet {
    this.bottomUpHierarchy = [];
    return n.accept(this);
  }
  protected processAssembledNode(
    t: DispatchTokenMix,
    self: ASTNode
  ): PinpointerRet {
    let l = 0,
      r = t.length - 1;
    while (l <= r) {
      let pivot = Math.floor((r + l) / 2);
      if (t[pivot] instanceof Token) {
        const tokenAtPiviot = t[pivot] as Token;
        if (tokenAtPiviot.end.char <= this.pinpointLocation.char) {
          l = pivot + 1;
          continue;
        }
        if (
          tokenAtPiviot.startWithWhitespace.char > this.pinpointLocation.char
        ) {
          r = pivot - 1;
          continue;
        }
        this.bottomUpHierarchy.push(self);
        return self; // yay this is us
      } else if (typeof t[pivot] === "function") {
        const astFunc = t[pivot] as () => PinpointerRet;
        const result = astFunc.call(this) as PinpointerRet;

        if (result === BinBefore) {
          r = pivot - 1;
          continue;
        }
        if (result === BinAfter) {
          l = pivot + 1;
          continue;
        }
        if (result instanceof ASTNode) {
          this.bottomUpHierarchy.push(self);
          return result;
        }
      } else {
        throw new Error(
          `Bad element in token mix: ${typeof t[pivot]} at index ${pivot}.`
        );
      }
    }
    const firstThing = t[0];
    if (firstThing instanceof Token) {
      if (firstThing.end.char <= this.pinpointLocation.char) {
        return BinAfter;
      }
      return BinBefore;
    }
    if (typeof firstThing === "function") {
      return firstThing.call(this);
    }
    throw new Error("Bad element in first token mix element");
  }
}
