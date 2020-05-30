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
import AssignmentNode, { AssignmentNodeRole } from "../ast/AssignmentNode";
import Scope from "./Scope";
import ErrorNode from "../ast/ErrorNode";
import {
  BlockStmtWithScope,
  ScadFileWithScope,
  FunctionDeclarationStmtWithScope,
  ModuleDeclarationStmtWithScope,
  LetExprWithScope,
  LcLetExprWithScope,
  LcForExprWithScope,
  LcForCExprWithScope,
} from "./nodesWithScopes";

export default class ASTScopePopulator implements ASTVisitor<ASTNode> {
  nearestScope: Scope;
  constructor(rootScope: Scope) {
    this.nearestScope = rootScope;
  }
  protected copyWithNewNearestScope(newScope: Scope) {
    return new ASTScopePopulator(newScope);
  }
  populate(n: ASTNode) {
    return n.accept(this);
  }
  visitScadFile(n: ScadFile): ASTNode {
    const sf = new ScadFileWithScope(
      n.pos,
      n.statements.map((stmt) => stmt.accept(this)),
      n.tokens
    );
    sf.scope = this.nearestScope; // we assume the nearest scope is the root scope, since we are processing the scad file
    return sf;
  }
  visitAssignmentNode(n: AssignmentNode): ASTNode {
    const an = new AssignmentNode(
      n.pos,
      n.name,
      n.value ? n.value.accept(this) : null,
      n.role,
      n.tokens
    );
    if (n.name && n.role != AssignmentNodeRole.ARGUMENT_ASSIGNMENT) {
      this.nearestScope.variables.set(an.name, an);
    }
    return an;
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
      n.end.accept(this),
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
    const letExprWithScope = new LetExprWithScope(n.pos, null, null, n.tokens);
    letExprWithScope.scope = new Scope();
    letExprWithScope.scope.parent = this.nearestScope;
    const copy = this.copyWithNewNearestScope(letExprWithScope.scope);
    letExprWithScope.args = n.args.map((a) =>
      a.accept(copy)
    ) as AssignmentNode[];
    letExprWithScope.expr = n.expr.accept(copy);
    return letExprWithScope;
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
    const newNode = new LcForExprWithScope(n.pos, null, null, n.tokens);
    newNode.scope = new Scope();
    newNode.scope.parent = this.nearestScope;
    const copy = this.copyWithNewNearestScope(newNode.scope);
    newNode.args = n.args.map((a) => a.accept(copy)) as AssignmentNode[];
    newNode.expr = n.expr.accept(copy);
    return newNode;
  }
  visitLcForCExpr(n: LcForCExpr): ASTNode {
    const newNode = new LcForCExprWithScope(
      n.pos,
      null,
      null,
      null,
      null,
      n.tokens
    );
    newNode.scope = new Scope();
    newNode.scope.parent = this.nearestScope;
    const copy = this.copyWithNewNearestScope(newNode.scope);
    newNode.args = n.args.map((a) => a.accept(copy)) as AssignmentNode[];
    newNode.incrArgs = n.incrArgs.map((a) =>
      a.accept(copy)
    ) as AssignmentNode[];
    newNode.cond = n.cond.accept(copy);
    newNode.expr = n.expr.accept(copy);
    return newNode;
  }
  visitLcLetExpr(n: LcLetExpr): ASTNode {
    const lcLetWithScopeExpr = new LcLetExprWithScope(
      n.pos,
      null,
      null,
      n.tokens
    );
    lcLetWithScopeExpr.scope = new Scope();
    lcLetWithScopeExpr.scope.parent = this.nearestScope;
    const copy = this.copyWithNewNearestScope(lcLetWithScopeExpr.scope);
    lcLetWithScopeExpr.args = n.args.map((a) =>
      a.accept(copy)
    ) as AssignmentNode[];
    lcLetWithScopeExpr.expr = n.expr.accept(copy);
    return lcLetWithScopeExpr;
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
    const md = new ModuleDeclarationStmtWithScope(
      n.pos,
      n.name,
      null,
      null,
      n.tokens
    );
    this.nearestScope.modules.set(md.name, md);
    md.scope = new Scope();
    md.scope.parent = this.nearestScope;
    const copy = this.copyWithNewNearestScope(md.scope);
    md.definitionArgs = n.definitionArgs.map((a) =>
      a.accept(copy)
    ) as AssignmentNode[];
    md.stmt = n.stmt.accept(copy);
    return md;
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): ASTNode {
    const fDecl = new FunctionDeclarationStmtWithScope(
      n.pos,
      n.name,
      null,
      null,
      n.tokens
    );
    this.nearestScope.functions.set(n.name, fDecl);
    fDecl.scope = new Scope();
    fDecl.scope.parent = this.nearestScope;
    const newPopulator = this.copyWithNewNearestScope(fDecl.scope);
    fDecl.definitionArgs = n.definitionArgs.map((a) =>
      a.accept(newPopulator)
    ) as AssignmentNode[];
    fDecl.expr = n.expr.accept(newPopulator);
    return fDecl;
  }
  visitBlockStmt(n: BlockStmt): ASTNode {
    const blk = new BlockStmtWithScope(n.pos, null, n.tokens);
    blk.scope = new Scope();
    blk.scope.parent = this.nearestScope;
    blk.children = n.children.map((c) =>
      c.accept(this.copyWithNewNearestScope(blk.scope))
    ) as Statement[];
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
