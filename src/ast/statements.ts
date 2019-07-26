import ASTNode from "./ASTNode";
import AssignmentNode from "./AssignmentNode";
import CodeLocation from "../CodeLocation";
import { Expression } from "./expressions";

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
}

export class ModuleInstantiationStmt extends Statement {
  constructor(
    pos: CodeLocation,
    public name: string,
    public args: AssignmentNode[]
  ) {
    super(pos);
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
}

export class BlockStmt extends Statement {
  constructor(pos: CodeLocation, public children: Statement[]) {
    super(pos);
  }
}

export class NoopStmt extends Statement {}
