import { BlockStmt } from "../ast/statements";
import { LetExpr } from "../ast/expressions";
import NodeWithScope from "./NodeWithScope";
import Scope from "./Scope";

export class BlockStmtWithScope extends BlockStmt implements NodeWithScope {
  scope: Scope;
}
export class LetExprWithScope extends LetExpr implements NodeWithScope {
  scope: Scope;
}
