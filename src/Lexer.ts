import CodeFile from "./CodeFile";
import CodeLocation from "./CodeLocation";
import Token from "./Token";
import TokenType from "./TokenType";
import LiteralToken from "./LiteralToken";
import LexingError from "./LexingError";
import keywords from "./keywords";

export default class Lexer {
  protected loc: CodeLocation;
  protected start: CodeLocation;
  public tokens: Token[] = [];
  constructor(public codeFile: CodeFile) {
    this.loc = new CodeLocation(codeFile, 0, 0, 0);
  }
  /**
   * Scans the whole CodeFile and splits it into tokens.
   * @throws LexingError
   */
  scan(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.loc.copy();
      this.scanToken();
    }
    this.addToken(TokenType.Eot);
    return this.tokens;
  }

  protected scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LeftParen);
        break;
      case ")":
        this.addToken(TokenType.RightParen);
        break;
      case "{":
        this.addToken(TokenType.LeftBrace);
        break;
      case "}":
        this.addToken(TokenType.RightBrace);
        break;
      case "[":
        this.addToken(TokenType.LeftBracket);
        break;
      case "]":
        this.addToken(TokenType.RightBracket);
        break;
      case "+":
        this.addToken(TokenType.Plus);
        break;
      case "-":
        this.addToken(TokenType.Minus);
        break;
      case "%":
        this.addToken(TokenType.Percent);
        break;
      case "*":
        this.addToken(TokenType.Star);
        break;
      case "/":
        if (this.match("/")) {
          // consume a comment
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.Slash);
        }
        break;
      case ".":
        // allow lexing of numbers without the leading 0
        if (/[0-9]/.test(this.peek())) {
          this.consumeNumberLiteral();
          break;
        }
        this.addToken(TokenType.Dot);
        break;
      case ",":
        this.addToken(TokenType.Comma);
        break;
      case ":":
        this.addToken(TokenType.Colon);
        break;
      case "?":
        this.addToken(TokenType.QuestionMark);
        break;
      case ";":
        this.addToken(TokenType.Semicolon);
        break;
      case "#":
        this.addToken(TokenType.Hash);
        break;
      case "!":
        if (this.match("=")) {
          this.addToken(TokenType.BangEqual);
        } else {
          this.addToken(TokenType.Bang);
        }
        break;
      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LessEqual);
        } else {
          this.addToken(TokenType.Less);
        }
        break;
      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GreaterEqual);
        } else {
          this.addToken(TokenType.Greater);
        }
        break;
      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EqualEqual);
        } else {
          this.addToken(TokenType.Equal);
        }
        break;
      case "&":
        if (this.match("&")) {
          this.addToken(TokenType.AND);
        } else {
          throw new LexingError(this.loc.copy(), "Single '&' is not allowed.");
        }
        break;
      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.OR);
        } else {
          throw new LexingError(this.loc.copy(), "Single '|' is not allowed.");
        }
        break;
      case "\n":
      case "\r":
      case " ":
      case "\t":
        break; // ignore whitespace
      case '"':
        this.consumeStringLiteral();
        break;
      default:
        if (/[0-9]/.test(c)) {
          this.consumeNumberLiteral();
        } else if (/[A-Za-z\$_]/.test(c)) {
          this.consumeIdentifierOrKeyword();
        } else {
          throw new LexingError(
            this.loc.copy(),
            `Unexpected character '${c}'.`
          );
        }
    }
  }
  protected consumeStringLiteral() {
    let str = "";
    while (this.peek() != '"' && !this.isAtEnd()) {
      const c = this.advance();
      // handle escape sequences
      if (c == "\\") {
        if (this.match('"')) {
          str += '"';
        } else if (this.match("\\")) {
          str += "\\";
        } else if (this.match("n")) {
          str += "\n";
        } else if (this.match("t")) {
          str += "\t";
        } else if (this.match("r")) {
          str += "\r";
        } else {
          throw new LexingError(
            this.loc.copy(),
            `Illegal escape sequence '\\${c}'`
          );
        }
        //TODO: Add unicode escape sequences handling
      } else {
        str += c;
      }
    }
    if (this.isAtEnd()) {
      throw new LexingError(this.loc.copy(), `Unterminated string literal.`);
    }
    this.advance();
    this.addToken(TokenType.StringLiteral, str);
  }
  protected consumeNumberLiteral() {
    while (
      /[0-9]/.test(this.peek()) ||
      (this.peek() == "." && /[0-9]/.test(this.peekNext())) ||
      (this.peek() == "e" && /[0-9]/.test(this.peekNext()))
    ) {
      this.advance();
    }
    const lexeme = this.codeFile.code.substring(this.start.char, this.loc.char);
    if ((lexeme.match(/\./g) || []).length > 1) {
      throw new LexingError(
        this.loc.copy(),
        `Too many dots in number literal ${lexeme}.`
      );
    }
    if ((lexeme.match(/e/g) || []).length > 1) {
      throw new LexingError(
        this.loc.copy(),
        `Too many e in number literal ${lexeme}.`
      );
    }
    const value = parseFloat(lexeme);
    if (isNaN(value)) {
      throw new LexingError(
        this.loc.copy(),
        `Invalid number literal ${lexeme}.`
      );
    }
    this.addToken(TokenType.NumberLiteral, value);
  }
  protected consumeIdentifierOrKeyword() {
    while (/[A-Za-z0-9_\$]/.test(this.peek()) && !this.isAtEnd()) {
      this.advance();
    }
    const lexeme = this.codeFile.code.substring(this.start.char, this.loc.char);
    if (lexeme in keywords) {
      this.addToken(keywords[lexeme]);
      return;
    }
    this.addToken(TokenType.Identifier, lexeme);
  }

  /**
   * Adds a token to the token list. If a value is provieded a LiteralToken is pushed.
   */
  protected addToken<TValue = any>(tokenType: TokenType, value: TValue = null) {
    const lexeme = this.codeFile.code.substring(this.start.char, this.loc.char);
    if (value != null) {
      this.tokens.push(
        new LiteralToken(tokenType, this.loc.copy(), lexeme, value)
      );
    } else {
      this.tokens.push(new Token(tokenType, this.loc.copy(), lexeme));
    }
  }
  protected isAtEnd() {
    return this.loc.char >= this.codeFile.code.length;
  }
  protected match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.codeFile.code[this.loc.char] !== expected) return false;
    this.advance();
    return true;
  }
  protected advance() {
    this.loc.char++;
    this.loc.col++;
    const c = this.codeFile.code[this.loc.char - 1];
    if (c === "\n") {
      this.loc.line++;
      this.loc.col = 0;
    }
    return c;
  }
  protected peek() {
    if (this.isAtEnd()) return "\0";
    return this.codeFile.code[this.loc.char];
  }
  protected peekNext() {
    if (this.loc.char + 1 >= this.codeFile.code.length) return "\0";
    return this.codeFile.code[this.loc.char + 1];
  }
}
