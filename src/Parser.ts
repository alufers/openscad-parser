import CodeFile from "./CodeFile";
import Token from "./Token";
import TokenType from "./TokenType";
import ParsingError from "./ParsingError";
import {
  Statement,
  UseStmt,
  NoopStmt,
  BlockStmt,
  ModuleDeclarationStmt,
  FunctionDeclarationStmt,
  ModuleInstantiationStmt,
  IfElseStatement
} from "./ast/statements";
import ScadFile from "./ast/ScadFile";
import CodeLocation from "./CodeLocation";
import AssignmentNode from "./ast/AssignmentNode";
import LiteralToken from "./LiteralToken";
import {
  Expression,
  LiteralExpr,
  Lookup,
  GroupingExpr,
  MemberLookup,
  ArrayLookupExpr,
  FunctionCallExpr,
  BinaryOpExpr,
  UnaryOpExpr,
  TernaryExpr
} from "./ast/expressions";
import keywords from "./keywords";

const moduleInstantiationTagTokens = [
  TokenType.Bang,
  TokenType.Hash,
  TokenType.Percent,
  TokenType.Star
];

const keywordModuleNames = [
  TokenType.For,
  TokenType.Let,
  TokenType.Assert,
  TokenType.Echo,
  TokenType.Each
];

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
        this.advance(); // advance the '>' token
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
    if (this.matchToken(TokenType.Function)) {
      return this.functionDeclarationStatement();
    }
    if (this.matchToken(TokenType.If)) {
      return this.ifElseStatement();
    }
    const assignmentOrInst = this.matchAssignmentOrModuleInstantation();
    if (assignmentOrInst) {
      return assignmentOrInst;
    }
    throw new ParsingError(
      this.getLocation(),
      `Unexpected token ${this.peek()}. Expected statement.`
    );
  }
  protected matchAssignmentOrModuleInstantation() {
    // identifiers can mean either an instantiation is incoming or an assignment
    if (this.matchToken(TokenType.Identifier)) {
      if (this.peek().type === TokenType.Equal) {
        return this.assignmentStatement();
      }
      if (this.peek().type === TokenType.LeftParen) {
        return this.moduleInstantiationStatement();
      }
      throw new ParsingError(
        this.getLocation(),
        `Unexpected token ${this.peek()} after identifier in statement.`
      );
    }
    if (
      this.matchToken(...moduleInstantiationTagTokens, ...keywordModuleNames)
    ) {
      return this.moduleInstantiationStatement();
    }
    return null;
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
    const args: AssignmentNode[] = this.args();
    const body = this.statement();
    return new ModuleDeclarationStmt(
      this.getLocation(),
      (nameToken as LiteralToken<string>).value,
      args,
      body
    );
  }
  protected functionDeclarationStatement(): FunctionDeclarationStmt {
    const nameToken = this.consume(
      TokenType.Identifier,
      "Expected function name after 'function' keyword"
    );
    this.consume(TokenType.LeftParen, "Expected '(' after function name");
    const args = this.args();
    this.consume(TokenType.Equal, "Expected '=' after function parameters");
    const body = this.expression();
    this.consume(
      TokenType.Semicolon,
      "Expected ';' after function declaration"
    );
    return new FunctionDeclarationStmt(
      this.getLocation(),
      (nameToken as LiteralToken<string>).value,
      args,
      body
    );
  }
  protected assignmentStatement() {
    const pos = this.getLocation();
    const name = this.previous() as LiteralToken<string>;
    this.consume(TokenType.Equal, "Expected '=' after assignment name.");
    const expr = this.expression();
    this.consume(
      TokenType.Semicolon,
      "Expected ';' after assignment statement."
    );
    return new AssignmentNode(pos, name.value, expr);
  }
  protected moduleInstantiationStatement(): ModuleInstantiationStmt {
    if (this.isAtEnd()) {
      throw new ParsingError(
        this.getLocation(),
        "Unexpected end of file before module instantiation."
      );
    }
    if (this.previous().type === TokenType.Bang) {
      this.advance();
      const mod = this.moduleInstantiationStatement();
      mod.tagRoot = true;
      return mod;
    }
    if (this.previous().type === TokenType.Hash) {
      this.advance();
      const mod = this.moduleInstantiationStatement();
      mod.tagHighlight = true;
      return mod;
    }
    if (this.previous().type === TokenType.Percent) {
      this.advance();
      const mod = this.moduleInstantiationStatement();
      mod.tagBackground = true;
      return mod;
    }
    if (this.previous().type === TokenType.Star) {
      this.advance();
      const mod = this.moduleInstantiationStatement();
      mod.tagDisabled = true;
      return mod;
    }
    const mod = this.singleModuleInstantiation();
    mod.child = this.statement();
    return mod;
  }
  protected ifElseStatement(): IfElseStatement {
    const prev = this.previous();
    this.consume(TokenType.LeftParen, "Expected '(' after the if keyword.");
    const cond = this.expression();
    this.consume(TokenType.RightParen, "Expected ')' after the if condition.");
    const thenBranch = this.statement();
    let elseBranch: Statement = null;
    if (this.matchToken(TokenType.Else)) {
      elseBranch = this.statement();
    }
    return new IfElseStatement(prev.pos, cond, thenBranch, elseBranch);
  }
  protected singleModuleInstantiation() {
    const prev = this.previous();
    this.consume(
      TokenType.LeftParen,
      "Expected '(' after module instantation."
    );
    let name: string;
    if (prev instanceof LiteralToken) {
      name = prev.value as string;
    } else {
      for (const keywordName of Object.keys(keywords)) {
        if (keywords[keywordName] === prev.type) {
          name = keywordName;
          break;
        }
      }
    }
    const args = this.args(true);
    return new ModuleInstantiationStmt(prev.pos, name, args, null);
  }

  /**
   * Parses an arguments list including the finishing paren. Can handle trailing and extra commas as well as an empty arguments list.
   * @param allowPositional Set to true when in call mode, positional arguments will be allowed.
   */
  protected args(allowPositional = false): AssignmentNode[] {
    this.consumeUselessCommas();
    const args: AssignmentNode[] = [];
    if (this.matchToken(TokenType.RightParen)) {
      return args;
    }
    while (true) {
      if (this.isAtEnd()) {
        break;
      }
      if (!allowPositional && this.peek().type !== TokenType.Identifier) {
        break;
      }
      let value: Expression = null;
      let name: string;
      if (!allowPositional || this.peekNext().type === TokenType.Equal) {
        // this is a named parameter
        name = (this.advance() as LiteralToken<string>).value;
        // a value is provided for this param
        if (this.matchToken(TokenType.Equal)) {
          value = this.expression();
        }
      } else {
        name = "";
        value = this.expression();
        // this is a positional paramater
      }

      const arg = new AssignmentNode(this.getLocation(), name, value);
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
  protected consumeUselessCommas() {
    while (this.matchToken(TokenType.Comma) && !this.isAtEnd()) {}
  }
  protected expression(): Expression {
    return this.ternary();
  }

  /**
   * Parses the ternary '? :' expression
   */
  protected ternary() {
    let expr = this.logicalOr();
    while (this.matchToken(TokenType.QuestionMark)) {
      const operator = this.previous();
      const thenBranch = this.ternary();
      this.consume(
        TokenType.Colon,
        "Expected ':' between ternary expression branches."
      );
      const elseBranch = this.ternary();
      expr = new TernaryExpr(operator.pos, expr, thenBranch, elseBranch);
    }
    return expr;
  }

  /**
   * Parses the '||' operators
   */
  protected logicalOr() {
    let expr = this.logicalAnd();
    while (this.matchToken(TokenType.OR)) {
      const operator = this.previous();
      const right = this.logicalAnd();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  /**
   * Parses the '&&' operators
   */
  protected logicalAnd() {
    let expr = this.equality();
    while (this.matchToken(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  /**
   * Parses the '==' and '!=' operators.
   */
  protected equality(): Expression {
    let expr = this.comparsion();
    while (this.matchToken(TokenType.EqualEqual, TokenType.BangEqual)) {
      const operator = this.previous();
      const right = this.comparsion();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  protected comparsion(): Expression {
    let expr = this.addition();
    while (
      this.matchToken(
        TokenType.Less,
        TokenType.LessEqual,
        TokenType.Greater,
        TokenType.GreaterEqual
      )
    ) {
      const operator = this.previous();
      const right = this.addition();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  protected addition(): Expression {
    let expr = this.multiplication();
    while (this.matchToken(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.multiplication();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  protected multiplication(): Expression {
    let expr = this.unary();
    while (
      this.matchToken(TokenType.Star, TokenType.Slash, TokenType.Percent)
    ) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right);
    }
    return expr;
  }

  /**
   * Parses +expr, -expr and !expr.
   */
  protected unary(): Expression {
    if (this.matchToken(TokenType.Plus, TokenType.Minus, TokenType.Bang)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryOpExpr(this.getLocation(), operator.type, right);
    }
    return this.memberLookupOrArrayLookup();
  }

  protected memberLookupOrArrayLookup() {
    let expr = this.primary();
    while (true) {
      if (this.matchToken(TokenType.Dot)) {
        const name = this.consume(
          TokenType.Identifier,
          "Expected member name after '.';"
        ) as LiteralToken<string>;
        expr = new MemberLookup(this.getLocation(), expr, name.value);
      } else if (this.matchToken(TokenType.LeftBracket)) {
        const index = this.expression();
        this.consume(
          TokenType.RightBracket,
          "Expected ']' after array index expression."
        );
        expr = new ArrayLookupExpr(this.getLocation(), expr, index);
      } else {
        break;
      }
    }
    return expr;
  }

  protected finishCall(name: LiteralToken<string>): Expression {
    const args = this.args(true);
    return new FunctionCallExpr(name.pos, name.value, args);
  }

  protected primary(): Expression {
    if (this.matchToken(TokenType.True)) {
      return new LiteralExpr(this.getLocation(), true);
    }
    if (this.matchToken(TokenType.False)) {
      return new LiteralExpr(this.getLocation(), false);
    }
    if (this.matchToken(TokenType.Undef)) {
      return new LiteralExpr<null>(this.getLocation(), null);
    }
    if (this.matchToken(TokenType.NumberLiteral)) {
      return new LiteralExpr(
        this.getLocation(),
        (this.previous() as LiteralToken<number>).value
      );
    }
    if (this.matchToken(TokenType.StringLiteral)) {
      return new LiteralExpr(
        this.getLocation(),
        (this.previous() as LiteralToken<string>).value
      );
    }
    if (this.matchToken(TokenType.Identifier)) {
      const tok = this.previous() as LiteralToken<string>;
      if (this.matchToken(TokenType.LeftParen)) {
        return this.finishCall(tok);
      }
      return new Lookup(this.getLocation(), tok.value);
    }
    if (this.matchToken(TokenType.LeftParen)) {
      const expr = this.expression();
      this.consume(
        TokenType.RightParen,
        "Expected ')' after grouping expression."
      );
      return new GroupingExpr(this.getLocation(), expr);
    }
    throw new ParsingError(
      this.getLocation(),
      "Failed to match primary expression."
    );
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
  protected peekNext(): Token {
    if (this.tokens[this.currentToken].type === TokenType.Eot) {
      return this.tokens[this.currentToken];
    }
    return this.tokens[this.currentToken + 1];
  }
  protected getLocation() {
    return this.peek().pos;
  }
  protected previous(): Token {
    return this.tokens[this.currentToken - 1];
  }
}
