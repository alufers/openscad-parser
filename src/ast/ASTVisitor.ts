import ScadFile from "./ScadFile";
import AssignmentNode from "./AssignmentNode";
import {
  UnaryOpExpr,
  BinaryOpExpr,
  TernaryExpr,
  ArrayLookupExpr,
  LiteralExpr,
  RangeExpr,
  VectorExpr,
  LookupExpr,
  FunctionCallExpr,
  FunctionCallLikeExpr,
  LetExpr,
  AssertExpr,
  EchoExpr,
  LcIfExpr,
  LcEachExpr,
  LcForExpr,
  LcForCExpr,
  LcLetExpr,
  GroupingExpr,
  MemberLookupExpr
} from "./expressions";
import {
  UseStmt,
  ModuleInstantiationStmt,
  ModuleDeclarationStmt,
  FunctionDeclarationStmt,
  BlockStmt,
  IfElseStatement,
  NoopStmt
} from "./statements";

export default interface ASTVisitor<R = void> {
  visitScadFile(n: ScadFile): R;
  visitAssignmentNode(n: AssignmentNode): R;
  visitUnaryOpExpr(n: UnaryOpExpr): R;
  visitBinaryOpExpr(n: BinaryOpExpr): R;
  visitTernaryExpr(n: TernaryExpr): R;
  visitArrayLookupExpr(n: ArrayLookupExpr): R;
  visitLiteralExpr(n: LiteralExpr<any>): R;
  visitRangeExpr(n: RangeExpr): R;
  visitVectorExpr(n: VectorExpr): R;
  visitLookupExpr(n: LookupExpr): R;
  visitMemberLookupExpr(n: MemberLookupExpr): R;
  visitFunctionCallExpr(n: FunctionCallExpr): R;
  visitFunctionCallLikeExpr(n: FunctionCallLikeExpr): R;
  visitLetExpr(n: LetExpr): R;
  visitAssertExpr(n: AssertExpr): R;
  visitEchoExpr(n: EchoExpr): R;
  visitLcIfExpr(n: LcIfExpr): R;
  visitLcEachExpr(n: LcEachExpr): R;
  visitLcForExpr(n: LcForExpr): R;
  visitLcForCExpr(n: LcForCExpr): R;
  visitLcLetExpr(n: LcLetExpr): R;
  visitGroupingExpr(n: GroupingExpr): R;
  visitUseStmt(n: UseStmt): R;
  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): R;
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): R;
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): R;
  visitBlockStmt(n: BlockStmt): R;
  visitNoopStmt(n: NoopStmt): R;
  visitIfElseStatement(n: IfElseStatement): R;
}
