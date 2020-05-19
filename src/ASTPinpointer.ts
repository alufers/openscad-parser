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

export const BinAfter = Symbol("BinAfter");
export const BinBefore = Symbol("BinBefore");

type PinpointerRet = ASTNode | typeof BinAfter | typeof BinBefore;

type DispatchTokenMix = (Token | (() => PinpointerRet))[];

/**
 * This class searches through the AST to find a node based on its position.
 * It may return BinAfter or BinBefore if the node cannot be found.
 */
export default class ASTPinpointer implements ASTVisitor<PinpointerRet> {
  /**
   * Contains all the ancestors of the pinpointed nodes. The pinpointed node is always first.
   */
  public bottomUpHierarchy: ASTNode[] = [];
  constructor(public pinpointLocation: CodeLocation) {}
  /**
   * Returns the node at pinpointLocation and populates bottomUpHierarchy.
   * @param n The AST (or AST fragment) to search through.
   */
  doPinpoint(n: ASTNode): PinpointerRet {
    this.bottomUpHierarchy = [];
    return n.accept(this);
  }
  protected binSearchDispatch(t: DispatchTokenMix, self: ASTNode) {
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
        if (tokenAtPiviot.startWithWhitespace.char > this.pinpointLocation.char) {
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
  visitScadFile(n: ScadFile): PinpointerRet {
    return this.binSearchDispatch(
      [...n.statements.map((stmt) => () => stmt.accept(this)), n.tokens.eot],
      n
    );
  }
  visitAssignmentNode(n: AssignmentNode): PinpointerRet {
    const arr: DispatchTokenMix = [];
    if (n.tokens.name) {
      arr.push(n.tokens.name);
    }
    if (n.tokens.equals) {
      arr.push(n.tokens.equals);
    }
    if (n.value) {
      arr.push(() => n.value.accept(this));
    }
    if (n.tokens.trailingCommas) {
      arr.push(...n.tokens.trailingCommas);
    }
    if (n.tokens.semicolon) {
      arr.push(n.tokens.semicolon);
    }
    return this.binSearchDispatch(arr, n);
  }
  visitUnaryOpExpr(n: UnaryOpExpr): PinpointerRet {
    return this.binSearchDispatch(
      [n.tokens.operator, () => n.right.accept(this)],
      n
    );
  }
  visitBinaryOpExpr(n: BinaryOpExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        () => n.left.accept(this),
        n.tokens.operator,
        () => n.right.accept(this),
      ],
      n
    );
  }
  visitTernaryExpr(n: TernaryExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        () => n.cond.accept(this),
        n.tokens.questionMark,
        () => n.ifExpr.accept(this),
        n.tokens.colon,
        () => n.elseExpr.accept(this),
      ],
      n
    );
  }
  visitArrayLookupExpr(n: ArrayLookupExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        () => n.array.accept(this),
        n.tokens.firstBracket,
        () => n.index.accept(this),
        n.tokens.secondBracket,
      ],
      n
    );
  }
  visitLiteralExpr(n: LiteralExpr<any>): PinpointerRet {
    return this.binSearchDispatch([n.tokens.literalToken], n);
  }
  visitRangeExpr(n: RangeExpr): PinpointerRet {
    if (n.step) {
      return this.binSearchDispatch(
        [
          () => n.begin.accept(this),
          n.tokens.firstColon,
          () => n.step.accept(this),
          n.tokens.secondColon,
          () => n.end.accept(this),
        ],
        n
      );
    }
    return this.binSearchDispatch(
      [
        () => n.begin.accept(this),
        n.tokens.firstColon,
        () => n.end.accept(this),
      ],
      n
    );
  }
  visitVectorExpr(n: VectorExpr): PinpointerRet {
    const arr = [];
    arr.push(n.tokens.firstBracket);
    for (let i = 0; i < n.children.length; i++) {
      arr.push(() => n.children[i].accept(this));
      if (i < n.children.length - 1) {
        arr.push(n.tokens.commas[i]);
      }
    }
    arr.push(...n.tokens.commas.slice(n.children.length));
    arr.push(n.tokens.secondBracket);
    return this.binSearchDispatch(arr, n);
  }
  visitLookupExpr(n: LookupExpr): PinpointerRet {
    return this.binSearchDispatch([n.tokens.identifier], n);
  }
  visitMemberLookupExpr(n: MemberLookupExpr): PinpointerRet {
    return this.binSearchDispatch(
      [() => n.expr.accept(this), n.tokens.dot, n.tokens.memberName],
      n
    );
  }
  visitFunctionCallExpr(n: FunctionCallExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.name,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
      ],
      n
    );
  }
  visitLetExpr(n: LetExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.name,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
      ],
      n
    );
  }
  visitAssertExpr(n: AssertExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.name,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
      ],
      n
    );
  }
  visitEchoExpr(n: EchoExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.name,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
      ],
      n
    );
  }
  visitLcIfExpr(n: LcIfExpr): PinpointerRet {
    const elseStuff = [];
    if (n.elseExpr) {
      elseStuff.push(n.tokens.elseKeyword, () => n.elseExpr.accept(this));
    }
    return this.binSearchDispatch(
      [
        n.tokens.ifKeyword,
        n.tokens.firstParen,
        () => n.cond.accept(this),
        n.tokens.secondParen,
        () => n.ifExpr.accept(this),
        ...elseStuff,
      ],
      n
    );
  }
  visitLcEachExpr(n: LcEachExpr): PinpointerRet {
    return this.binSearchDispatch(
      [n.tokens.eachKeyword, () => n.expr.accept(this)],
      n
    );
  }
  visitLcForExpr(n: LcForExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.forKeyword,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
        () => n.expr.accept(this),
      ],
      n
    );
  }
  visitLcForCExpr(n: LcForCExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.forKeyword,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.firstSemicolon,
        () => n.cond.accept(this),
        n.tokens.secondSemicolon,
        ...n.incrArgs.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
        () => n.expr.accept(this),
      ],
      n
    );
  }
  visitLcLetExpr(n: LcLetExpr): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.letKeyword,
        n.tokens.firstParen,
        ...n.args.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
        () => n.expr.accept(this),
      ],
      n
    );
  }
  visitGroupingExpr(n: GroupingExpr): PinpointerRet {
    return this.binSearchDispatch(
      [n.tokens.firstParen, () => n.inner.accept(this), n.tokens.secondParen],
      n
    );
  }
  visitUseStmt(n: UseStmt): PinpointerRet {
    return this.binSearchDispatch(
      [n.tokens.useKeyword, n.tokens.useKeyword],
      n
    );
  }
  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): PinpointerRet {
    const arr = [];
    arr.push(...n.tokens.modifiersInOrder);
    arr.push(n.tokens.name);
    arr.push(n.tokens.firstParen);
    arr.push(...n.args.map((a) => () => a.accept(this)));
    arr.push(n.tokens.secondParen);
    if (n.child) {
      arr.push(() => n.child.accept(this));
    }
    if (n.child) {
      arr.push(() => n.child.accept(this));
    }
    return this.binSearchDispatch(arr, n);
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.moduleKeyword,
        n.tokens.name,
        n.tokens.firstParen,
        ...n.definitionArgs.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
        () => n.stmt.accept(this),
      ],
      n
    );
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.functionKeyword,
        n.tokens.name,
        n.tokens.firstParen,
        ...n.definitionArgs.map((a) => () => a.accept(this)),
        n.tokens.secondParen,
        () => n.expr.accept(this),
        n.tokens.semicolon,
      ],
      n
    );
  }
  visitBlockStmt(n: BlockStmt): PinpointerRet {
    return this.binSearchDispatch(
      [
        n.tokens.firstBrace,
        ...n.children.map((a) => () => a.accept(this)),
        n.tokens.secondBrace,
      ],
      n
    );
  }
  visitNoopStmt(n: NoopStmt): PinpointerRet {
    return this.binSearchDispatch([n.tokens.semicolon], n);
  }
  visitIfElseStatement(n: IfElseStatement): PinpointerRet {
    const arr = [];
    arr.push(...n.tokens.modifiersInOrder);
    arr.push(n.tokens.ifKeyword);
    arr.push(n.tokens.firstParen);
    arr.push(() => n.cond);
    arr.push(n.tokens.secondParen);
    arr.push(() => n.thenBranch.accept(this));
    if (n.elseBranch) {
      arr.push(n.tokens.elseKeyword, () => n.elseBranch.accept(this));
    }
    return this.binSearchDispatch(arr, n);
  }
  visitErrorNode(n: ErrorNode): PinpointerRet {
    return this.binSearchDispatch([...n.tokens.tokens], n);
  }
}
