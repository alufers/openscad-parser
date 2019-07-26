import ASTNode from "./ASTNode";
import CodeLocation from "../CodeLocation";
import { Statement } from "./statements";

export default class ScadFile extends ASTNode {
  constructor(pos: CodeLocation, public statements: Statement[]) {
    super(pos);
  }
}
