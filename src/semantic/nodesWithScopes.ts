import {
  BlockStmt,
  FunctionDeclarationStmt,
  ModuleDeclarationStmt,
} from "../ast/statements";
import { LetExpr } from "../ast/expressions";
import NodeWithScope from "./NodeWithScope";
import Scope from "./Scope";
import ScadFile from "../ast/ScadFile";

export class BlockStmtWithScope extends BlockStmt implements NodeWithScope {
  scope: Scope;
}
export class LetExprWithScope extends LetExpr implements NodeWithScope {
  scope: Scope;
}

export class ScadFileWithScope extends ScadFile implements NodeWithScope {
  scope: Scope;
}

export class FunctionDeclarationStmtWithScope extends FunctionDeclarationStmt
  implements NodeWithScope {
  scope: Scope;
}

export class ModuleDeclarationStmtWithScope extends ModuleDeclarationStmt
  implements NodeWithScope {
  scope: Scope;
}
