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

  copy(): Scope {
    const s = new Scope();
    s.siblingScopes = [...this.siblingScopes];
    s.functions = this.functions;
    s.variables = this.variables;
    s.modules = this.modules;
    return s;
  }
}
