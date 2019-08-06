import ASTNode from "./ASTNode";
import CodeLocation from "../CodeLocation";
import { Statement } from "./statements";
import ASTVisitor from "./ASTVisitor";
import Token from "../Token";

/**
 * The root node of any AST tree. 
 * 
 * Contains top-level statements including the use statements.
 * 
 * @category AST
 */
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
