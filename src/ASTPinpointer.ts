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
import { statement } from "@babel/template";
import FormattingConfiguration from "./FormattingConfiguration";
import ErrorNode from "./ast/ErrorNode";
import CodeLocation from "./CodeLocation";

export const BinAfter = Symbol("BinAfter");
export const BinBefore = Symbol("BinBefore");

type PinpointerRet = ASTNode | typeof BinAfter | typeof BinBefore;

/**
 * This class searches through the AST to find a node based on its position.
 * It may return BinAfter or BinBefore if the node cannot be found.
 */
export default class ASTPinpointer implements ASTVisitor<PinpointerRet> {
  constructor(public pinpointLocation: CodeLocation) {}
  doPinpoint(n: ASTNode): PinpointerRet {
    return n.accept(this);
  }
  visitScadFile(n: ScadFile): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitAssignmentNode(n: AssignmentNode): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitUnaryOpExpr(n: UnaryOpExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitBinaryOpExpr(n: BinaryOpExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitTernaryExpr(n: TernaryExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitArrayLookupExpr(n: ArrayLookupExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLiteralExpr(n: LiteralExpr<any>): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitRangeExpr(n: RangeExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitVectorExpr(n: VectorExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLookupExpr(n: LookupExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitMemberLookupExpr(n: MemberLookupExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitFunctionCallExpr(n: FunctionCallExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLetExpr(n: LetExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitAssertExpr(n: AssertExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitEchoExpr(n: EchoExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLcIfExpr(n: LcIfExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLcEachExpr(n: LcEachExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLcForExpr(n: LcForExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLcForCExpr(n: LcForCExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitLcLetExpr(n: LcLetExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitGroupingExpr(n: GroupingExpr): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitUseStmt(n: UseStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitBlockStmt(n: BlockStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitNoopStmt(n: NoopStmt): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitIfElseStatement(n: IfElseStatement): PinpointerRet {
    throw new Error("Method not implemented.");
  }
  visitErrorNode(n: ErrorNode): PinpointerRet {
    throw new Error("Method not implemented.");
  }
}
