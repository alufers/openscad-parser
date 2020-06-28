import CodeLocation from "../CodeLocation";
import Token from "../Token";
import ASTNode from "./ASTNode";
import ASTVisitor from "./ASTVisitor";

/**
 * Is put into the AST after it failed to parse something. Such an AST is invalid, and an error must have been generated.
 * It is generated during synchronisation, whuch occurs on every statement, but you should expect it everywhere when handling the AST.
 * @category AST
 */
export default class ErrorNode extends ASTNode {
  constructor(
    pos: CodeLocation,
    public tokens: {
      tokens: Token[];
    }
  ) {
    super(pos);
  }
  accept<R>(visitor: ASTVisitor<R>): R {
    return visitor.visitErrorNode(this);
  }
}
