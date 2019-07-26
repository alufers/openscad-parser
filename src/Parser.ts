import CodeFile from "./CodeFile";
import Token from "./Token";
import TokenType from "./TokenType";
import ParsingError from "./ParsingError";
import {
  Statement,
  UseStmt,
  NoopStmt,
  BlockStmt,
  ModuleDeclarationStmt
} from "./ast/statements";
import ScadFile from "./ast/ScadFile";
import CodeLocation from "./CodeLocation";
import AssignmentNode from "./ast/AssignmentNode";
import LiteralToken from "./LiteralToken";
import { Expression } from "./ast/expressions";

export default class Parser {
  protected currentToken = 0;
  constructor(public code: CodeFile, public tokens: Token[]) {}

  parse() {
    const statements: Statement[] = [];
    while (!this.isAtEnd()) {
      if (this.matchToken(TokenType.Use)) {
        const beginning = this.consume(
          TokenType.Less,
          "Expected '<' after use"
        );
        while (!this.checkToken(TokenType.Greater) && !this.isAtEnd()) {
          this.advance();
        }
        if (this.isAtEnd()) {
          throw new ParsingError(
            this.getLocation(),
            "Unterminated 'use' statement"
          );
        }
        const filename = this.code.code.substring(
          beginning.pos.char,
          this.previous().pos.char
        );
        statements.push(new UseStmt(this.getLocation(), filename));
      } else {
        statements.push(this.statement());
      }
    }
    return new ScadFile(new CodeLocation(this.code), statements);
  }

  protected statement() {
    if (this.matchToken(TokenType.Semicolon)) {
      return new NoopStmt(this.getLocation());
    }
    if (this.matchToken(TokenType.LeftBrace)) {
      return this.blockStatement();
    }
    if (this.matchToken(TokenType.Module)) {
      return this.moduleDeclarationStatement();
    }
    this.advance();
  }
  protected blockStatement() {
    const startLocation = this.getLocation();
    const innerStatements: Statement[] = [];
    while (!this.checkToken(TokenType.RightBrace) && !this.isAtEnd()) {
      innerStatements.push(this.statement());
    }
    this.consume(TokenType.RightBrace, "Expected '}' after block statement");
    return new BlockStmt(startLocation, innerStatements);
  }
  protected moduleDeclarationStatement(): ModuleDeclarationStmt {
    const nameToken = this.consume(
      TokenType.Identifier,
      "Expected module name after 'module' keyword"
    );
    this.consume(TokenType.LeftParen, "Expected '(' after module name");
    const args: AssignmentNode[] = this.namedArguments();
    const body = this.statement();
    return new ModuleDeclarationStmt(
      this.getLocation(),
      (nameToken as LiteralToken<string>).value,
      args,
      body
    );
  }
  namedArguments(): AssignmentNode[] {
    this.consumeUselessCommas();
    const args: AssignmentNode[] = [];
    if (this.matchToken(TokenType.RightParen)) {
      return args;
    }
    while (this.matchToken(TokenType.Identifier) && !this.isAtEnd()) {
      let value: Expression = null;
      // a value is provided for this param
      if (this.matchToken(TokenType.Equal)) {
        value = this.expression();
      }
      const arg = new AssignmentNode(
        this.getLocation(),
        (this.previous() as LiteralToken<string>).value,
        value
      );
      args.push(arg);

      if (this.matchToken(TokenType.Comma)) {
        this.consumeUselessCommas();
        if (this.matchToken(TokenType.RightParen)) {
          return args;
        }
        continue;
      }
      this.consumeUselessCommas();
      // end of named arguments
      if (this.matchToken(TokenType.RightParen)) {
        return args;
      }
    }
    if (this.isAtEnd()) {
      throw new ParsingError(
        this.getLocation(),
        `Unterminated parameters list.`
      );
    }
    throw new ParsingError(
      this.getLocation(),
      `Unexpected token ${this.advance()} in named arguments list.`
    );
  }
  consumeUselessCommas() {
    while (this.matchToken(TokenType.Comma) && !this.isAtEnd()) {}
  }
  expression(): Expression {
    throw new Error("Method not implemented.");
  }

  protected consume(tt: TokenType, errorMessage: string) {
    if (this.checkToken(tt)) {
      return this.advance();
    }
    throw new ParsingError(this.getLocation(), errorMessage);
  }
  protected matchToken(...toMatch: TokenType[]) {
    for (const tt of toMatch) {
      if (this.checkToken(tt)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  protected checkToken(tt: TokenType) {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type == tt;
  }
  protected advance() {
    if (!this.isAtEnd()) {
      this.currentToken++;
    }
    return this.previous();
  }
  protected isAtEnd() {
    return this.peek().type === TokenType.Eot;
  }
  protected peek(): Token {
    return this.tokens[this.currentToken];
  }
  protected getLocation() {
    return this.peek().pos;
  }
  protected previous(): Token {
    return this.tokens[this.currentToken - 1];
  }
}
