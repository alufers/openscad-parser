import AssignmentNode from "../ast/AssignmentNode";
import ASTNode from "../ast/ASTNode";
import {
  AnonymousFunctionExpr,
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
      n.args.map((a) => a.accept(this)) as AssignmentNode[],
      n.child.accept(this),
      n.tokens
    );
    resolved.resolvedDeclaration = this.currentScope.lookupModule(n.name);
    if (!resolved.resolvedDeclaration) {
      this.errorCollector.reportError(new UnresolvedModuleError(n.pos, n.name));
      return n;
    }
    return resolved;
  }

  // resolving functionCall expressions no longer needed, since function calls use lookup expressions
  
  // visitFunctionCallExpr(n: FunctionCallExpr): ASTNode {
  //   const resolved = new ResolvedFunctionCallExpr(
  //     n.pos,
  //     n.callee,
  //     n.args.map((a) => a.accept(this)) as AssignmentNode[],
  //     n.tokens
  //   );
  //   resolved.resolvedDeclaration = this.currentScope.lookupFunction(n.name);
  //   if (!resolved.resolvedDeclaration) {
  //     this.errorCollector.reportError(
  //       new UnresolvedFunctionError(n.pos, n.name)
  //     );
  //     return n;
  //   }
  //   return resolved;
  // }

  // scope handling
  private copyWithNextScope(s: Scope) {
    if (!s) {
      throw new Error("Scope cannot be falsy");
    }
    return new SymbolResolver(this.errorCollector, s);
  }
  visitBlockStmt(n: BlockStmt): ASTNode {
    return super.visitBlockStmt.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitLetExpr(n: LetExpr): ASTNode {
    return super.visitLetExpr.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitScadFile(n: ScadFile): ASTNode {
    return super.visitScadFile.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): ASTNode {
    return super.visitFunctionDeclarationStmt.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): ASTNode {
    return super.visitModuleDeclarationStmt.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitLcLetExpr(n: LcLetExpr): ASTNode {
    return super.visitLcLetExpr.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitLcForExpr(n: LcForExpr): ASTNode {
    return super.visitLcForExpr.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitLcForCExpr(n: LcForCExpr): ASTNode {
    return super.visitLcForCExpr.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
  visitAnonymousFunctionExpr(n: AnonymousFunctionExpr): ASTNode {
    return super.visitAnonymousFunctionExpr.call(
      this.copyWithNextScope((n as unknown as NodeWithScope).scope),
      n
    );
  }
}
