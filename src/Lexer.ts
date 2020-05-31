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
  UnterminatedFilenameLexingError,
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
  protected start: CodeLocation;
  protected startWithWhitespace: CodeLocation;
  public tokens: Token[] = [];
  protected currentExtraTokens: ExtraToken[] = [];

  protected charOffset = 0;
  protected lineOffset = 0;
  protected colOffset = 0;
  protected _currLocCache: CodeLocation = null;

  constructor(
    public codeFile: CodeFile,
    public errorCollector: ErrorCollector
  ) {}
  /**
   * Scans the whole CodeFile and splits it into tokens.
   * @throws LexingError
   */
  scan(): Token[] {
    this.start = this.getLoc();
    this.startWithWhitespace = this.getLoc();
    while (!this.isAtEnd()) {
      this.start = this.getLoc();
      this.scanToken();
    }
    this.start = this.getLoc();
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
          const comment = new SingleLineComment(this.getLoc(), "");
          // consume a comment
          while (this.peek() != "\n" && !this.isAtEnd()) {
            comment.contents += this.advance();
          }
          this.currentExtraTokens.push(comment);
        } else if (this.match("*")) {
          const comment = new MultiLineComment(this.getLoc(), "");

          // multiline comment
          while (
            !(this.peek() == "*" && this.peekNext() == "/") &&
            !this.isAtEnd()
          ) {
            comment.contents += this.advance();
          }
          if (this.isAtEnd()) {
            throw this.errorCollector.reportError(
              new UnterminatedMultilineCommentLexingError(this.getLoc())
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
            new SingleCharacterNotAllowedLexingError(this.getLoc(), "&")
          );
        }
        break;
      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.OR);
        } else {
          throw this.errorCollector.reportError(
            new SingleCharacterNotAllowedLexingError(this.getLoc(), "&")
          );
        }
        break;
      case "\n":
        this.currentExtraTokens.push(new NewLineExtraToken(this.getLoc()));
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
            new UnexpectedCharacterLexingError(this.getLoc(), c)
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
            new IllegalStringEscapeSequenceLexingError(this.getLoc(), `\\${c}`)
          );
        }
        //TODO: Add unicode escape sequences handling
      } else {
        str += c;
      }
    }
    if (this.isAtEnd()) {
      throw this.errorCollector.reportError(
        new UnterminatedStringLiteralLexingError(this.getLoc())
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
    const lexeme = this.codeFile.code.substring(
      this.start.char,
      this.charOffset
    );
    if ((lexeme.match(/\./g) || []).length > 1) {
      throw this.errorCollector.reportError(
        new TooManyDotsInNumberLiteralLexingError(this.getLoc(), lexeme)
      );
    }
    if ((lexeme.match(/e/g) || []).length > 1) {
      throw this.errorCollector.reportError(
        new TooManyEInNumberLiteralLexingError(this.getLoc(), lexeme)
      );
    }
    const value = parseFloat(lexeme);
    if (isNaN(value) || !isFinite(value)) {
      throw this.errorCollector.reportError(
        new InvalidNumberLiteralLexingError(this.getLoc(), lexeme)
      );
    }
    this.addToken(TokenType.NumberLiteral, value);
  }
  protected consumeIdentifierOrKeyword() {
    while (/[A-Za-z0-9_\$]/.test(this.peek()) && !this.isAtEnd()) {
      this.advance();
    }
    const lexeme = this.codeFile.code.substring(
      this.start.char,
      this.charOffset
    );
    if (lexeme in keywords) {
      const keywordType = keywords[lexeme];
      this.addToken(keywordType);
      // check if we need to lex a filename
      if (keywordType === TokenType.Use) {
        this.consumeFileNameInChevrons();
      }
      return;
    }
    this.addToken(TokenType.Identifier, lexeme);
  }

  protected consumeFileNameInChevrons() {
    this.startWithWhitespace = this.getLoc();
    while (!this.isAtEnd()) {
      this.start = this.getLoc();
      if (
        this.match("\n") ||
        this.match("\t") ||
        this.match("\r") ||
        this.match(" ")
      )
        continue; // ignore whitespace

      if (this.match("<")) break;
      // The openscad parser does not allow putting comments like this: `use /* ddd*/ <file.scad>`
      // We must check that and report an error
      throw this.errorCollector.reportError(
        new UnexpectedCharacterLexingError(this.getLoc(), this.advance())
      );
    }
    if (this.isAtEnd()) {
      throw this.errorCollector.reportError(
        new UnterminatedFilenameLexingError(this.getLoc())
      );
    }
    let filename = "";
    let didEnd = false;
    while (!this.isAtEnd()) {
      const c = this.advance();
      if (c === ">") {
        didEnd = true;
        break;
      }
      filename += c;
    }
    if (!didEnd) {
      throw this.errorCollector.reportError(
        new UnterminatedFilenameLexingError(this.getLoc())
      );
    }
    this.addToken(TokenType.FilenameInChevrons, filename);
  }

  /**
   * Adds a token to the token list. If a value is provieded a LiteralToken is pushed.
   *
   * Additionally it handles clearing and attaching the extra tokens.
   */
  protected addToken<TValue = any>(tokenType: TokenType, value: TValue = null) {
    const lexeme = this.codeFile.code.substring(
      this.start.char,
      this.charOffset
    );
    let token;
    if (value != null) {
      token = new LiteralToken(
        tokenType,
        this.start,
        this.getLoc(),
        lexeme,
        value
      );
    } else {
      token = new Token(tokenType, this.start, this.getLoc(), lexeme);
    }
    token.extraTokens = this.currentExtraTokens;
    token.startWithWhitespace = this.startWithWhitespace;
    this.startWithWhitespace = this.getLoc();
    this.currentExtraTokens = [];
    this.tokens.push(token);
  }
  protected isAtEnd() {
    return this.charOffset >= this.codeFile.code.length;
  }
  protected match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.codeFile.code[this.charOffset] !== expected) return false;
    this.advance();
    return true;
  }
  protected advance() {
    const c = this.codeFile.code[this.charOffset];
    this.charOffset++;
    if (c === "\n") {
      this.lineOffset++;
      this.colOffset = 0;
    } else {
      this.colOffset++;
    }
    this._currLocCache = null;
    return c;
  }

  protected getLoc() {
    if (!this._currLocCache) {
      this._currLocCache = new CodeLocation(
        this.codeFile,
        this.charOffset,
        this.lineOffset,
        this.colOffset
      );
    }
    return this._currLocCache;
  }

  protected peek() {
    if (this.isAtEnd()) return "\0";
    return this.codeFile.code[this.charOffset];
  }
  protected peekNext() {
    if (this.charOffset + 1 >= this.codeFile.code.length) return "\0";
    return this.codeFile.code[this.charOffset + 1];
  }
}
