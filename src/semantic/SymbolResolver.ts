import ASTNode from "../ast/ASTNode";
import {
  FunctionCallExpr,
  LcForCExpr,
  LcForExpr,
  LcLetExpr,
  LetExpr,
  LookupExpr,
} from "../ast/expressions";
import ScadFile from "../ast/ScadFile";
import {
  BlockStmt,
  FunctionDeclarationStmt,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
} from "../ast/statements";
import ASTMutator from "../ASTMutator";
import ErrorCollector from "../ErrorCollector";
import NodeWithScope from "./NodeWithScope";
import {
  ResolvedFunctionCallExpr,
  ResolvedLookupExpr,
  ResolvedModuleInstantiationStmt,
} from "./resolvedNodes";
import Scope from "./Scope";
import {
  UnresolvedFunctionError,
  UnresolvedModuleError,
  UnresolvedVariableError,
} from "./unresolvedSymbolErrors";

export default class SymbolResolver extends ASTMutator {
  constructor(
    private errorCollector: ErrorCollector,
    public currentScope: Scope = null
  ) {
    super();
  }

  visitLookupExpr(n: LookupExpr): ASTNode {
    const resolved = new ResolvedLookupExpr(n.pos, n.name, n.tokens);
    resolved.resolvedDeclaration = this.currentScope.lookupVariable(n.name);
    if (!resolved.resolvedDeclaration) {
      this.errorCollector.reportError(
        new UnresolvedVariableError(n.pos, n.name)
      );
      return n;
    }
    return resolved;
  }

  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): ASTNode {
    const resolved = new ResolvedModuleInstantiationStmt(
      n.pos,
      n.name,
      n.args,
      n.child,
      n.tokens
    );
    resolved.resolvedDeclaration = this.currentScope.lookupModule(n.name);
    if (!resolved.resolvedDeclaration) {
      this.errorCollector.reportError(new UnresolvedModuleError(n.pos, n.name));
      return n;
    }
    return resolved;
  }

  visitFunctionCallExpr(n: FunctionCallExpr): ASTNode {
    const resolved = new ResolvedFunctionCallExpr(
      n.pos,
      n.name,
      n.args,
      n.tokens
    );
    resolved.resolvedDeclaration = this.currentScope.lookupFunction(n.name);
    if (!resolved.resolvedDeclaration) {
      this.errorCollector.reportError(
        new UnresolvedFunctionError(n.pos, n.name)
      );
      return n;
    }
    return resolved;
  }

  // scope handling
  private copyWithNextScope(s: Scope) {
    if (!s) {
      throw new Error("Scope cannot be falsy");
    }
    return new SymbolResolver(this.errorCollector, s);
  }
  visitBlockStmt(n: BlockStmt): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitLetExpr(n: LetExpr): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitScadFile(n: ScadFile): ASTNode {
    return super.visitScadFile.call(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope),
      n
    );
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitLcLetExpr(n: LcLetExpr): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitLcForExpr(n: LcForExpr): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
  visitLcForCExpr(n: LcForCExpr): ASTNode {
    return n.accept(
      this.copyWithNextScope(((n as unknown) as NodeWithScope).scope)
    );
  }
}
