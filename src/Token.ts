import CodeLocation from "./CodeLocation";
import TokenType from "./TokenType";

export default class Token {
  constructor(
    public type: TokenType,
    public pos: CodeLocation,
    public lexeme: string
  ) {}

  toString(): string {
    return `token ${TokenType[this.type]} ${this.pos.toString()}`;
  }
}
