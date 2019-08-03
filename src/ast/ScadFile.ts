import ASTNode from "./ASTNode";
import CodeLocation from "../CodeLocation";
import { Statement } from "./statements";
import ASTVisitor from "./ASTVisitor";
import Token from "../Token";

export default class ScadFile extends ASTNode {
  constructor(
    pos: CodeLocation,
    public statements: Statement[],
    public tokens: {
      eot: Token;
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitScadFile(this);
  }
}
