import ASTNode from "./ASTNode";
import { Expression } from "./expressions";
import CodeLocation from "../CodeLocation";
import ASTVisitor from "./ASTVisitor";
export default class AssignmentNode extends ASTNode {
  /**
   * The name of the value being assigned
   */
  name: string;
  /**
   * THe value of the name being assigned.
   */
  value: Expression;
  constructor(pos: CodeLocation, name: string, value: Expression) {
    super(pos);
    this.name = name;
    this.value = value;
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitAssignmentNode(this);
  }
}
