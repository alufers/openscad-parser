import CodeLocation from "./CodeLocation";
import Token from "./Token";
import TokenType from "./TokenType";

/**
 * This represents a token which contains a literal value (e.g. string literal, number literal and identifiers.).
 */
export default class LiteralToken<ValueT> extends Token {
  constructor(
    type: TokenType,
    pos: CodeLocation,
    lexeme: string,
    public value: ValueT
  ) {
    super(type, pos, lexeme);
  }
}
