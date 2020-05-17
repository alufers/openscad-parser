import CodeFile from "./CodeFile";
import CodeLocation from "./CodeLocation";
import ErrorCollector from "./ErrorCollector";
import {
  IllegalStringEscapeSequenceLexingError,
  InvalidNumberLiteralLexingError,
  SingleCharacterNotAllowedLexingError,
  TooManyDotsInNumberLiteralLexingError,
  TooManyEInNumberLiteralLexingError,
  UnexpectedCharacterLexingError,
  UnterminatedMultilineCommentLexingError,
  UnterminatedStringLiteralLexingError,
} from "./errors/lexingErrors";
import {
  ExtraToken,
  MultiLineComment,
  NewLineExtraToken,
  SingleLineComment,
} from "./extraTokens";
import keywords from "./keywords";
import LiteralToken from "./LiteralToken";
import Token from "./Token";
import TokenType from "./TokenType";

export default class Lexer {
  protected loc: CodeLocation;
  protected start: CodeLocation;
  public tokens: Token[] = [];
  protected currentExtraTokens: ExtraToken[] = [];
  constructor(
    public codeFile: CodeFile,
    public errorCollector: ErrorCollector
  ) {
    this.loc = new CodeLocation(codeFile, 0, 0, 0);
  }
  /**
   * Scans the whole CodeFile and splits it into tokens.
   * @throws LexingError
   */
  scan(): Token[] {
    this.start = this.loc.copy();
    while (!this.isAtEnd()) {
      this.start = this.loc.copy();
      this.scanToken();
    }
    this.start = this.loc.copy();
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
          const comment = new SingleLineComment(this.loc.copy(), "");
          // consume a comment
          while (this.peek() != "\n" && !this.isAtEnd()) {
            comment.contents += this.advance();
          }
          this.currentExtraTokens.push(comment);
        } else if (this.match("*")) {
          const comment = new MultiLineComment(this.loc.copy(), "");

          // multiline comment
          while (
            !(this.peek() == "*" && this.peekNext() == "/") &&
            !this.isAtEnd()
          ) {
            comment.contents += this.advance();
          }
          if (this.isAtEnd()) {
            throw this.errorCollector.reportError(
              new UnterminatedMultilineCommentLexingError(this.loc.copy())
            );
          }
          this.currentExtraTokens.push(comment);
          this.advance(); // advance the star
          this.advance(); // advance the slash
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
          throw this.errorCollector.reportError(
            new SingleCharacterNotAllowedLexingError(this.loc.copy(), "&")
          );
        }
        break;
      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.OR);
        } else {
          throw this.errorCollector.reportError(
            new SingleCharacterNotAllowedLexingError(this.loc.copy(), "&")
          );
        }
        break;
      case "\n":
        this.currentExtraTokens.push(new NewLineExtraToken(this.loc.copy()));
        break;
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
          throw this.errorCollector.reportError(
            new UnexpectedCharacterLexingError(this.loc.copy(), c)
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
          throw this.errorCollector.reportError(
            new IllegalStringEscapeSequenceLexingError(
              this.loc.copy(),
              `\\${c}`
            )
          );
        }
        //TODO: Add unicode escape sequences handling
      } else {
        str += c;
      }
    }
    if (this.isAtEnd()) {
      throw this.errorCollector.reportError(
        new UnterminatedStringLiteralLexingError(this.loc.copy())
      );
    }
    this.advance();
    this.addToken(TokenType.StringLiteral, str);
  }
  protected consumeNumberLiteral() {
    while (
      /[0-9]/.test(this.peek()) ||
      (this.peek() == "." && /[0-9]/.test(this.peekNext())) ||
      (this.peek() == "e" && /[0-9\-]/.test(this.peekNext())) ||
      (this.peek() == "-" && /[0-9]/.test(this.peekNext()))
    ) {
      this.advance();
    }
    const lexeme = this.codeFile.code.substring(this.start.char, this.loc.char);
    if ((lexeme.match(/\./g) || []).length > 1) {
      throw this.errorCollector.reportError(
        new TooManyDotsInNumberLiteralLexingError(this.loc.copy(), lexeme)
      );
    }
    if ((lexeme.match(/e/g) || []).length > 1) {
      throw this.errorCollector.reportError(
        new TooManyEInNumberLiteralLexingError(this.loc.copy(), lexeme)
      );
    }
    const value = parseFloat(lexeme);
    if (isNaN(value) || !isFinite(value)) {
      throw this.errorCollector.reportError(
        new InvalidNumberLiteralLexingError(this.loc.copy(), lexeme)
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
   *
   * Additionally it handles clearing and attaching the extra tokens.
   */
  protected addToken<TValue = any>(tokenType: TokenType, value: TValue = null) {
    const lexeme = this.codeFile.code.substring(this.start.char, this.loc.char);
    let token;
    if (value != null) {
      token = new LiteralToken(tokenType, this.start.copy(), lexeme, value);
    } else {
      token = new Token(tokenType, this.start.copy(), lexeme);
    }
    token.extraTokens = this.currentExtraTokens;
    this.currentExtraTokens = [];
    this.tokens.push(token);
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
