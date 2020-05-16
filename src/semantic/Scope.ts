import {
  FunctionDeclarationStmt,
  ModuleDeclarationStmt,
} from "../ast/statements";
import AssignmentNode from "../ast/AssignmentNode";

export default class Scope {
  parent: Scope = null;
  functions = new Map<string, FunctionDeclarationStmt>();
  variables = new Map<string, AssignmentNode>();
  modules = new Map<string, ModuleDeclarationStmt>();
}
