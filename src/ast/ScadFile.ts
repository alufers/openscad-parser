import ASTNode from "./ASTNode";
import CodeLocation from "../CodeLocation";
import { Statement } from "./statements";
import ASTVisitor from "./ASTVisitor";

export default class ScadFile extends ASTNode {
  constructor(pos: CodeLocation, public statements: Statement[]) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitScadFile(this);
  }
}
