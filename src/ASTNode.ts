import CodeLocation from "./CodeLocation";

export default abstract class ASTNode {
  constructor(public pos: CodeLocation) {}
}
