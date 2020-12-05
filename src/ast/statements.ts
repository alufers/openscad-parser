import CodeLocation from "../CodeLocation";
import DocComment from "../comments/DocComment";
import LiteralToken from "../LiteralToken";
import Token from "../Token";
import AssignmentNode from "./AssignmentNode";
import ASTNode from "./ASTNode";
import ASTVisitor from "./ASTVisitor";
import { Expression } from "./expressions";

/**
 * @category AST
 */
export abstract class Statement extends ASTNode {}

/**
 * @category AST
 */
export class UseStmt extends Statement {
  /**
   *
   * @param pos
   * @param filename The used filename
   */
  constructor(
    pos: CodeLocation,
    public filename: string,
    public tokens: {
      useKeyword: Token;
      filename: LiteralToken<string>;
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitUseStmt(this);
  }
}

/**
 * @category AST
 */
export class IncludeStmt extends Statement {
  /**
   *
   * @param pos
   * @param filename The used filename
   */
  constructor(
    pos: CodeLocation,
    public filename: string,
    public tokens: {
      includeKeyword: Token;
      filename: LiteralToken<string>;
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitIncludeStmt(this);
  }
}

/**
 * @category AST
 */
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

/**
 * @category AST
 */
export class ModuleInstantiationStmt extends Statement
  implements TaggableStatement {
  /**
   * !
   */
  public tagRoot: boolean = false;

  /**
   * #
   */
  public tagHighlight: boolean = false;

  /**
   * %
   */
  public tagBackground: boolean = false;

  /**
   * *
   */
  public tagDisabled: boolean = false;

  constructor(
    pos: CodeLocation,
    public name: string,
    public args: AssignmentNode[],
    public child: Statement,
    public tokens: {
      name: Token;
      firstParen: Token;
      secondParen: Token;
      modifiersInOrder: Token[];
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitModuleInstantiationStmt(this);
  }
}

/**
 * @category AST
 */
export class ModuleDeclarationStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public name: string,
    public definitionArgs: AssignmentNode[],
    public stmt: Statement,
    public tokens: {
      moduleKeyword: Token;
      name: Token;
      firstParen: Token;
      secondParen: Token;
    },
    public docComment: DocComment
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitModuleDeclarationStmt(this);
  }
}

/**
 * @category AST
 */
export class FunctionDeclarationStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public name: string,
    public definitionArgs: AssignmentNode[],
    public expr: Expression,
    public tokens: {
      functionKeyword: Token;
      name: Token;
      firstParen: Token;
      secondParen: Token;
      equals: Token;
      semicolon: Token;
    },
    public docComment: DocComment
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitFunctionDeclarationStmt(this);
  }
}

/**
 * @category AST
 */
export class BlockStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public children: Statement[],
    public tokens: {
      firstBrace: Token;
      secondBrace: Token;
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

/**
 * @category AST
 */
export class NoopStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public tokens: {
      semicolon: Token;
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitNoopStmt(this);
  }
}

/**
 * @category AST
 */
export class IfElseStatement extends Statement implements TaggableStatement {
  public tagRoot: boolean = false;
  public tagHighlight: boolean = false;
  public tagBackground: boolean = false;
  public tagDisabled: boolean = false;
  constructor(
    pos: CodeLocation,
    public cond: Expression,
    public thenBranch: Statement,
    public elseBranch: Statement,
    public tokens: {
      ifKeyword: Token;
      firstParen: Token;
      secondParen: Token;
      elseKeyword: Token;
      modifiersInOrder: Token[];
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitIfElseStatement(this);
  }
}
