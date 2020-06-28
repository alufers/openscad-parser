import AssignmentNode from "../ast/AssignmentNode";
import {
  FunctionDeclarationStmt,
  ModuleDeclarationStmt,
} from "../ast/statements";

export default class Scope {
  siblingScopes: Scope[] = [];
  parent: Scope = null;
  functions = new Map<string, FunctionDeclarationStmt>();
  variables = new Map<string, AssignmentNode>();
  modules = new Map<string, ModuleDeclarationStmt>();
}
