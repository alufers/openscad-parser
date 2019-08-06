import CodeLocation from "../CodeLocation";
import ASTVisitor from "./ASTVisitor";

/**
 * @category AST
 */
export default abstract class ASTNode {
  constructor(public pos: CodeLocation) {}
  abstract accept<R>(visitor: ASTVisitor<R>): R;
}
