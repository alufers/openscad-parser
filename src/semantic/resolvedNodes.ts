import AssignmentNode from "../ast/AssignmentNode";
import { FunctionCallExpr, LookupExpr } from "../ast/expressions";
import {
  FunctionDeclarationStmt,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
} from "../ast/statements";

export class ResolvedFunctionCallExpr extends FunctionCallExpr {
  resolvedDeclaration: FunctionDeclarationStmt;
}

export class ResolvedLookupExpr extends LookupExpr {
  resolvedDeclaration: AssignmentNode;
}

export class ResolvedModuleInstantiationStmt extends ModuleInstantiationStmt {
  resolvedDeclaration: ModuleDeclarationStmt;
}
