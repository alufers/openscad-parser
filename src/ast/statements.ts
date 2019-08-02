import ASTNode from "./ASTNode";
import AssignmentNode from "./AssignmentNode";
import CodeLocation from "../CodeLocation";
import { Expression } from "./expressions";
import ASTVisitor from "./ASTVisitor";

export abstract class Statement extends ASTNode {}

export class UseStmt extends Statement {
  /**
   *
   * @param pos
   * @param filename The used filename
   */
  constructor(pos: CodeLocation, public filename: string) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitUseStmt(this);
  }
}

interface TaggableStatement {
  /**
   * Set to true if this module instantation has been tagged with a '!' symbol.
   */
  tagRoot: boolean;

  /**
   * Set to true if this module instantation has been tagged with a '#' symbol.
   */
  tagHighlight: boolean;

  /**
   * Set to true if this module instantation has been tagged with a '%' symbol.
   */
  tagBackground: boolean;

  /**
   * Set to true if this module instantation has been tagged with a '*' symbol.
   */
  tagDisabled: boolean;
}

export class ModuleInstantiationStmt extends Statement
  implements TaggableStatement {
  public tagRoot: boolean = false;
  public tagHighlight: boolean = false;
  public tagBackground: boolean = false;
  public tagDisabled: boolean = false;

  constructor(
    pos: CodeLocation,
    public name: string,
    public args: AssignmentNode[],
    public child: Statement
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitModuleInstantiationStmt(this);
  }
}

export class ModuleDeclarationStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public name: string,
    public definitionArgs: AssignmentNode[],
    public stmt: Statement
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitModuleDeclarationStmt(this);
  }
}

export class FunctionDeclarationStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public name: string,
    public definitionArgs: AssignmentNode[],
    public expr: Expression
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitFunctionDeclarationStmt(this);
  }
}

export class BlockStmt extends Statement {
  constructor(pos: CodeLocation, public children: Statement[]) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class NoopStmt extends Statement {
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitNoopStmt(this);
  }
}

export class IfElseStatement extends Statement implements TaggableStatement {
  public tagRoot: boolean = false;
  public tagHighlight: boolean = false;
  public tagBackground: boolean = false;
  public tagDisabled: boolean = false;
  constructor(
    pos: CodeLocation,
    public cond: Expression,
    public thenBranch: Statement,
    public elseBranch: Statement
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitIfElseStatement(this);
  }
}
