import Scope from "./Scope";
import ASTNode from "../ast/ASTNode";

export default interface NodeWithScope extends ASTNode {
  scope: Scope;
}
