import LexingError from "./LexingError";
import CodeLocation from "../CodeLocation";

export class UnterminatedMultilineCommentLexingError extends LexingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated multiline comment.`);
  }
}

export class SingleCharacterNotAllowedLexingError extends LexingError {
  constructor(pos: CodeLocation, char: string) {
    super(pos, `Single '${char}' is not allowed.`);
  }
}

export class UnexpectedCharacterLexingError extends LexingError {
  constructor(pos: CodeLocation, char: string) {
    super(pos, `Unexpected character '${char}'.`);
  }
}

export class IllegalStringEscapeSequenceLexingError extends LexingError {
  constructor(pos: CodeLocation, sequence: string) {
    super(pos, `Illegal string escape sequence '${sequence}'.`);
  }
}

export class UnterminatedStringLiteralLexingError extends LexingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated string literal.`);
  }
}

export class TooManyDotsInNumberLiteralLexingError extends LexingError {
  constructor(pos: CodeLocation, lexeme: string) {
    super(
      pos,
      `Too many dots in number literal ${lexeme}. Number literals must contain zero or one dot.`
    );
  }
}

export class TooManyEInNumberLiteralLexingError extends LexingError {
  constructor(pos: CodeLocation, lexeme: string) {
    super(
      pos,
      `Too many 'e' separators in number literal ${lexeme}. Number literals must contain zero or one 'e'.`
    );
  }
}

export class InvalidNumberLiteralLexingError extends LexingError {
  constructor(pos: CodeLocation, lexeme: string) {
    super(pos, `Invalid number literal ${lexeme}.`);
  }
}