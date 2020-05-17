import ASTNode from "../ast/ASTNode";
import ASTVisitor from "../ast/ASTVisitor";
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
} from "../ast/expressions";
import ScadFile from "../ast/ScadFile";
import {
  BlockStmt,
  FunctionDeclarationStmt,
  IfElseStatement,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
  NoopStmt,
  UseStmt,
  Statement,
} from "../ast/statements";
import AssignmentNode from "../ast/AssignmentNode";
import Scope from "./Scope";
import ErrorNode from "../ast/ErrorNode";
import { BlockStmtWithScope } from "./nodesWithScopes";

export default class ASTScopePopulator implements ASTVisitor<ASTNode> {
  nearestScope: Scope;
  constructor(rootScope: Scope) {
    this.nearestScope = rootScope;
  }
  protected copyWithNewNearestScope(newScope: Scope) {
    return new ASTScopePopulator(newScope);
  }
  visitScadFile(n: ScadFile): ASTNode {
    return new ScadFile(
      n.pos,
      n.statements.map((stmt) => stmt.accept(this)),
      n.tokens
    );
  }
  visitAssignmentNode(n: AssignmentNode): ASTNode {
    this.nearestScope.variables.set(n.name, n);
    return new AssignmentNode(n.pos, n.name, n.value.accept(this), n.tokens);
  }
  visitUnaryOpExpr(n: UnaryOpExpr): ASTNode {
    return new UnaryOpExpr(n.pos, n.operation, n.right.accept(this), n.tokens);
  }
  visitBinaryOpExpr(n: BinaryOpExpr): ASTNode {
    return new BinaryOpExpr(
      n.pos,
      n.left.accept(this),
      n.operation,
      n.right.accept(this),
      n.tokens
    );
  }
  visitTernaryExpr(n: TernaryExpr): ASTNode {
    return new TernaryExpr(
      n.pos,
      n.cond.accept(this),
      n.ifExpr.accept(this),
      n.elseExpr.accept(this),
      n.tokens
    );
  }
  visitArrayLookupExpr(n: ArrayLookupExpr): ASTNode {
    return new ArrayLookupExpr(
      n.pos,
      n.array.accept(this),
      n.index.accept(this),
      n.tokens
    );
  }
  visitLiteralExpr(n: LiteralExpr<any>): ASTNode {
    return new LiteralExpr<any>(n.pos, n.value, n.tokens);
  }
  visitRangeExpr(n: RangeExpr): ASTNode {
    return new RangeExpr(
      n.pos,
      n.begin.accept(this),
      n.step ? n.step.accept(this) : null,
      n.accept(this),
      n.tokens
    );
  }
  visitVectorExpr(n: VectorExpr): ASTNode {
    return new VectorExpr(
      n.pos,
      n.children.map((c) => c.accept(this)),
      n.tokens
    );
  }
  visitLookupExpr(n: LookupExpr): ASTNode {
    return new LookupExpr(n.pos, n.name, n.tokens);
  }
  visitMemberLookupExpr(n: MemberLookupExpr): ASTNode {
    return new MemberLookupExpr(n.pos, n.expr.accept(this), n.member, n.tokens);
  }
  visitFunctionCallExpr(n: FunctionCallExpr): ASTNode {
    return new FunctionCallExpr(
      n.pos,
      n.name,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.tokens
    );
  }
  visitLetExpr(n: LetExpr): ASTNode {
    return new LetExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitAssertExpr(n: AssertExpr): ASTNode {
    return new AssertExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitEchoExpr(n: EchoExpr): ASTNode {
    return new EchoExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitLcIfExpr(n: LcIfExpr): ASTNode {
    return new LcIfExpr(
      n.pos,
      n.cond.accept(this),
      n.ifExpr.accept(this),
      n.elseExpr ? n.elseExpr.accept(this) : null,
      n.tokens
    );
  }
  visitLcEachExpr(n: LcEachExpr): ASTNode {
    return new LcEachExpr(n.pos, n.expr.accept(this), n.tokens);
  }
  visitLcForExpr(n: LcForExpr): ASTNode {
    return new LcForExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitLcForCExpr(n: LcForCExpr): ASTNode {
    return new LcForCExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.incrArgs.map((a) => a.accept(this)) as AssignmentNode[],
      n.cond.accept(this),
      n.expr.accept(this),
      n.tokens
    );
  }
  visitLcLetExpr(n: LcLetExpr): ASTNode {
    return new LcLetExpr(
      n.pos,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitGroupingExpr(n: GroupingExpr): ASTNode {
    return new GroupingExpr(n.pos, n.inner.accept(this), n.tokens);
  }
  visitUseStmt(n: UseStmt): ASTNode {
    return n;
  }
  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): ASTNode {
    return new ModuleInstantiationStmt(
      n.pos,
      n.name,
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.child.accept(this),
      n.tokens
    );
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): ASTNode {
    return new ModuleDeclarationStmt(
      n.pos,
      n.name,
      n.definitionArgs.map((a) => a.accept(this)) as AssignmentNode[],
      n.stmt.accept(this),
      n.tokens
    );
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): ASTNode {
    return new FunctionDeclarationStmt(
      n.pos,
      n.name,
      n.definitionArgs.map((a) => a.accept(this)) as AssignmentNode[],
      n.expr.accept(this),
      n.tokens
    );
  }
  visitBlockStmt(n: BlockStmt): ASTNode {
    const blk = new BlockStmtWithScope(
      n.pos,
      (n.children.map((c) => () =>
        c.accept(this.copyWithNewNearestScope(blk.scope))
      ) as unknown) as Statement[],
      n.tokens
    );
    return blk;
  }
  visitNoopStmt(n: NoopStmt): ASTNode {
    return new NoopStmt(n.pos, n.tokens);
  }
  visitIfElseStatement(n: IfElseStatement): ASTNode {
    return new IfElseStatement(
      n.pos,
      n.cond.accept(this),
      n.thenBranch.accept(this),
      n.elseBranch ? n.elseBranch.accept(this) : null,
      n.tokens
    );
  }
  visitErrorNode(n: ErrorNode): ASTNode {
    return new ErrorNode(n.pos, n.tokens);
  }
}
