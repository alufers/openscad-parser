import CodeFile from "./CodeFile";
import Token from "./Token";
import TokenType from "./TokenType";
import ParsingError from "./errors/ParsingError";
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
  LookupExpr,
  GroupingExpr,
  MemberLookupExpr,
  ArrayLookupExpr,
  FunctionCallExpr,
  BinaryOpExpr,
  UnaryOpExpr,
  TernaryExpr,
  LcLetExpr,
  LcEachExpr,
  LcIfExpr,
  ListComprehensionExpression,
  VectorExpr,
  RangeExpr,
  LcForExpr,
  LcForCExpr,
  LetExpr,
  AssertExpr,
  EchoExpr
} from "./ast/expressions";
import keywords from "./keywords";
import {
  UnterminatedUseStatementParsingError,
  UnexpectedTokenWhenStatementParsingError,
  UnexpectedTokenAfterIdentifierInStatementParsingError,
  UnexpectedEndOfFileBeforeModuleInstantiationParsingError,
  UnterminatedParametersListParsingError,
  UnexpectedTokenInNamedArgumentsListParsingError,
  FailedToMatchPrimaryExpressionParsingError,
  UnterminatedVectorExpressionParsingError,
  UnexpectedTokenInForLoopParamsListParsingError,
  UnterminatedForLoopParamsParsingError,
  ConsumptionParsingError
} from "./errors/parsingErrors";
import ErrorCollector from "./ErrorCollector";

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
  TokenType.Each,
  TokenType.If
];

const listComprehensionElementKeywords = [
  TokenType.For,
  TokenType.Let,
  TokenType.Each,
  TokenType.If
];

export default class Parser {
  protected currentToken = 0;

  /**
   * The code file being parsed.
   */
  public code: CodeFile;

  /**
   * The tokens being parsed.
   */
  public tokens: Token[];

  /**
   * The ErrorCollector for this parser. All the errors encountered by the parser will be put there, since it does not throw on non-fatal errors.
   */
  public errorCollector: ErrorCollector;

  constructor(code: CodeFile, tokens: Token[], errorCollector: ErrorCollector) {
    this.code = code;
    this.tokens = tokens;
    this.errorCollector = errorCollector;
  }

  /**
   * Attempts to parse a file and return the AST with the ScadFile as a root node.
   */
  parse(): ScadFile {
    const statements: Statement[] = [];
    while (!this.isAtEnd()) {
      if (this.matchToken(TokenType.Use)) {
        const useKeyword = this.previous();
        const beginning = this.consume(TokenType.Less, "after use");
        while (!this.checkToken(TokenType.Greater) && !this.isAtEnd()) {
          this.advance();
        }
        if (this.isAtEnd()) {
          throw new UnterminatedUseStatementParsingError(this.getLocation());
        }
        const filename = this.code.code.substring(
          beginning.pos.char,
          this.previous().pos.char
        );
        statements.push(
          new UseStmt(this.getLocation(), filename, {
            useKeyword
          })
        );
        this.advance(); // advance the '>' token
      } else {
        statements.push(this.statement());
      }
    }
    const eot = this.previous();
    return new ScadFile(new CodeLocation(this.code), statements, { eot });
  }
  protected statement() {
    if (this.matchToken(TokenType.Semicolon)) {
      const semicolon = this.previous();
      return new NoopStmt(this.getLocation(), { semicolon });
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
    const assignmentOrInst = this.matchAssignmentOrModuleInstantation();
    if (assignmentOrInst) {
      return assignmentOrInst;
    }
    throw new UnexpectedTokenWhenStatementParsingError(
      this.getLocation(),
      this.peek().type
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
      throw new UnexpectedTokenAfterIdentifierInStatementParsingError(
        this.getLocation(),
        this.peek().type
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
    const firstBrace = this.previous();
    const startLocation = this.getLocation();
    const innerStatements: Statement[] = [];
    while (!this.checkToken(TokenType.RightBrace) && !this.isAtEnd()) {
      innerStatements.push(this.statement());
    }
    this.consume(TokenType.RightBrace, "after block statement");
    const secondBrace = this.previous();
    return new BlockStmt(startLocation, innerStatements, {
      firstBrace,
      secondBrace
    });
  }
  protected moduleDeclarationStatement(): ModuleDeclarationStmt {
    const moduleKeyword = this.previous();
    const nameToken = this.consume(
      TokenType.Identifier,
      "after 'module' keyword"
    );
    this.consume(TokenType.LeftParen, "after module name");
    const firstParen = this.previous();
    const args: AssignmentNode[] = this.args();
    const secondParen = this.previous();
    const body = this.statement();
    return new ModuleDeclarationStmt(
      this.getLocation(),
      (nameToken as LiteralToken<string>).value,
      args,
      body,
      {
        moduleKeyword,
        name: nameToken,
        firstParen,
        secondParen
      }
    );
  }
  protected functionDeclarationStatement(): FunctionDeclarationStmt {
    const functionKeyword = this.previous();
    const nameToken = this.consume(
      TokenType.Identifier,
      "after 'function' keyword"
    );
    this.consume(TokenType.LeftParen, "after function name");
    const firstParen = this.previous();
    const args = this.args();
    const secondParen = this.previous();
    this.consume(TokenType.Equal, "after function parameters");
    const equals = this.previous();
    const body = this.expression();
    this.consume(TokenType.Semicolon, "after function declaration");
    const semicolon = this.previous();
    return new FunctionDeclarationStmt(
      this.getLocation(),
      (nameToken as LiteralToken<string>).value,
      args,
      body,
      {
        functionKeyword,
        equals,
        firstParen,
        name: nameToken,
        secondParen,
        semicolon
      }
    );
  }
  protected assignmentStatement() {
    const pos = this.getLocation();
    const name = this.previous() as LiteralToken<string>;
    this.consume(TokenType.Equal, "after assignment name");
    const equals = this.previous();
    const expr = this.expression();
    this.consume(TokenType.Semicolon, "after assignment statement");
    const semicolon = this.previous();
    return new AssignmentNode(pos, name.value, expr, {
      name,
      equals,
      trailingCommas: null,
      semicolon
    });
  }
  protected moduleInstantiationStatement():
    | ModuleInstantiationStmt
    | IfElseStatement {
    if (this.isAtEnd()) {
      throw new UnexpectedEndOfFileBeforeModuleInstantiationParsingError(
        this.getLocation()
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
    if (!(mod instanceof IfElseStatement)) {
      mod.child = this.statement();
    }
    return mod;
  }
  protected ifElseStatement(): IfElseStatement {
    const ifKeyword = this.previous();
    this.consume(TokenType.LeftParen, "after the if keyword");
    const firstParen = this.previous();
    const cond = this.expression();
    this.consume(TokenType.RightParen, "after the if condition");
    const secondParen = this.previous();
    const thenBranch = this.statement();
    let elseBranch: Statement = null;
    let elseKeyword = null;
    if (this.matchToken(TokenType.Else)) {
      elseKeyword = this.previous();
      elseBranch = this.statement();
    }
    return new IfElseStatement(ifKeyword.pos, cond, thenBranch, elseBranch, {
      ifKeyword,
      elseKeyword,
      firstParen,
      secondParen
    });
  }
  protected singleModuleInstantiation() {
    const prev = this.previous();
    if (prev.type === TokenType.If) {
      return this.ifElseStatement();
    }
    this.consume(TokenType.LeftParen, "after module instantation");
    const firstParen = this.previous();
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
    const secondParen = this.previous();
    return new ModuleInstantiationStmt(prev.pos, name, args, null, {
      firstParen,
      name: prev,
      secondParen
    });
  }
  /**
   * Parses an argument list including the finishing paren. Can handle trailing and extra commas as well as an empty arguments list.
   * The initial paren must be consumed.
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
      let nameToken: Token = null;
      let equals: Token = null;
      if (!allowPositional || this.peekNext().type === TokenType.Equal) {
        // this is a named parameter
        name = (this.advance() as LiteralToken<string>).value;
        nameToken = this.previous();
        // a value is provided for this param
        if (this.matchToken(TokenType.Equal)) {
          equals = this.previous();
          value = this.expression();
        }
      } else {
        name = "";
        value = this.expression();
        // this is a positional paramater
      }

      const arg = new AssignmentNode(this.getLocation(), name, value, {
        name: nameToken,
        equals,
        semicolon: null,
        trailingCommas: []
      });
      args.push(arg);

      if (this.matchToken(TokenType.Comma)) {
        arg.tokens.trailingCommas.push(this.previous());
        this.consumeUselessCommas(arg.tokens.trailingCommas);
        if (this.matchToken(TokenType.RightParen)) {
          return args;
        }
        continue;
      }
      this.consumeUselessCommas(arg.tokens.trailingCommas);
      // end of named arguments
      if (this.matchToken(TokenType.RightParen)) {
        return args;
      }
    }
    if (this.isAtEnd()) {
      throw new UnterminatedParametersListParsingError(this.getLocation());
    }
    throw new UnexpectedTokenInNamedArgumentsListParsingError(
      this.getLocation(),
      this.advance().type
    );
  }
  /**
   * Parses arguments from the 'for' loop comprehension.
   * The initial paren must be consumed. Stops on semicolon or right paren, but does not consume them.
   */
  protected forComprehensionArgs(): AssignmentNode[] {
    this.consumeUselessCommas();
    const args: AssignmentNode[] = [];
    if (
      this.checkToken(TokenType.RightParen) ||
      this.checkToken(TokenType.Semicolon)
    ) {
      return args;
    }
    while (true) {
      if (this.isAtEnd()) {
        break;
      }
      if (this.peek().type !== TokenType.Identifier) {
        break;
      }

      // this is a named parameter
      const name = (this.advance() as LiteralToken<string>).value;
      const nameToken = this.previous();
      // a value is provided for this param
      this.consume(TokenType.Equal, "after for variable name");
      const equals = this.previous();
      const value = this.expression();

      const arg = new AssignmentNode(this.getLocation(), name, value, {
        equals,
        semicolon: null,
        name: nameToken,
        trailingCommas: []
      });
      args.push(arg);

      if (this.matchToken(TokenType.Comma)) {
        arg.tokens.trailingCommas.push(this.previous());
        this.consumeUselessCommas(arg.tokens.trailingCommas);
        if (
          this.checkToken(TokenType.RightParen) ||
          this.checkToken(TokenType.Semicolon)
        ) {
          return args;
        }
        continue;
      }
      this.consumeUselessCommas(arg.tokens.trailingCommas);
      if (
        this.checkToken(TokenType.RightParen) ||
        this.checkToken(TokenType.Semicolon)
      ) {
        return args;
      }
    }
    if (this.isAtEnd()) {
      throw new UnterminatedForLoopParamsParsingError(this.getLocation());
    }
    throw new UnexpectedTokenInForLoopParamsListParsingError(
      this.getLocation(),
      this.advance().type
    );
  }
  /**
   * Consumes redundant commas and returns true if it consumed any.
   *
   * You can also pass an array of tokens to which all the comma tokens will be pushed.
   */
  protected consumeUselessCommas(trailingArr?: Token[]) {
    let ret = false;
    while (this.matchToken(TokenType.Comma) && !this.isAtEnd()) {
      if (trailingArr) {
        trailingArr.push(this.previous());
      }
      ret = true;
    }
    return ret;
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
      const questionMark = this.previous();
      const thenBranch = this.ternary();
      this.consume(TokenType.Colon, "between ternary expression branches");
      const colon = this.previous();
      const elseBranch = this.ternary();
      expr = new TernaryExpr(questionMark.pos, expr, thenBranch, elseBranch, {
        questionMark,
        colon
      });
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
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
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
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
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
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
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
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
    }
    return expr;
  }
  protected addition(): Expression {
    let expr = this.multiplication();
    while (this.matchToken(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.multiplication();
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
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
      expr = new BinaryOpExpr(this.getLocation(), expr, operator.type, right, {
        operator
      });
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
      return new UnaryOpExpr(this.getLocation(), operator.type, right, {
        operator
      });
    }
    return this.memberLookupOrArrayLookup();
  }
  protected memberLookupOrArrayLookup() {
    let expr = this.primary();
    while (true) {
      if (this.matchToken(TokenType.Dot)) {
        const dot = this.previous();
        const name = this.consume(
          TokenType.Identifier,
          "after '.'"
        ) as LiteralToken<string>;
        expr = new MemberLookupExpr(this.getLocation(), expr, name.value, {
          dot,
          memberName: name
        });
      } else if (this.matchToken(TokenType.LeftBracket)) {
        const firstBracket = this.previous();
        const index = this.expression();
        this.consume(TokenType.RightBracket, "after array index expression");
        const secondBracket = this.previous();
        expr = new ArrayLookupExpr(this.getLocation(), expr, index, {
          firstBracket,
          secondBracket
        });
      } else {
        break;
      }
    }
    return expr;
  }
  protected finishCall(nameToken: LiteralToken<string>): Expression {
    let name = nameToken.value;
    const firstParen = this.previous();
    const args = this.args(true);
    const secondParen = this.previous();
    return new FunctionCallExpr(nameToken.pos, name, args, {
      name: nameToken,
      firstParen,
      secondParen
    });
  }
  protected primary(): Expression {
    if (this.matchToken(TokenType.True)) {
      return new LiteralExpr(this.getLocation(), true, {
        literalToken: this.previous() as LiteralToken<any>
      });
    }
    if (this.matchToken(TokenType.False)) {
      return new LiteralExpr(this.getLocation(), false, {
        literalToken: this.previous() as LiteralToken<any>
      });
    }
    if (this.matchToken(TokenType.Undef)) {
      return new LiteralExpr<null>(this.getLocation(), null, {
        literalToken: this.previous() as LiteralToken<any>
      });
    }
    if (this.matchToken(TokenType.NumberLiteral)) {
      return new LiteralExpr(
        this.getLocation(),
        (this.previous() as LiteralToken<number>).value,
        {
          literalToken: this.previous() as LiteralToken<any>
        }
      );
    }
    if (this.matchToken(TokenType.StringLiteral)) {
      return new LiteralExpr(
        this.getLocation(),
        (this.previous() as LiteralToken<string>).value,
        {
          literalToken: this.previous() as LiteralToken<any>
        }
      );
    }
    if (this.matchToken(TokenType.Identifier)) {
      const tok = this.previous() as LiteralToken<string>;
      if (this.matchToken(TokenType.LeftParen)) {
        return this.finishCall(tok);
      }
      return new LookupExpr(this.getLocation(), tok.value, {
        identifier: tok
      });
    }
    if (this.matchToken(TokenType.Assert)) {
      const keyword = this.previous();
      this.consume(TokenType.LeftParen, "after call expression");
      const firstParen = this.previous();
      const vars = this.args(true);
      const secondParen = this.previous();
      const innerExpr = this.expression();
      return new AssertExpr(keyword.pos, vars, innerExpr, {
        firstParen,
        secondParen,
        name: keyword
      });
    }
    if (this.matchToken(TokenType.Let)) {
      const keyword = this.previous();
      this.consume(TokenType.LeftParen, `after call expression`);
      const firstParen = this.previous();
      const vars = this.args(true);
      const secondParen = this.previous();
      const innerExpr = this.expression();
      return new LetExpr(keyword.pos, vars, innerExpr, {
        firstParen,
        secondParen,
        name: keyword
      });
    }
    if (this.matchToken(TokenType.Echo)) {
      const keyword = this.previous();
      this.consume(TokenType.LeftParen, `after call expression`);
      const firstParen = this.previous();
      const vars = this.args(true);
      const secondParen = this.previous();
      const innerExpr = this.expression();
      return new EchoExpr(keyword.pos, vars, innerExpr, {
        firstParen,
        secondParen,
        name: keyword
      });
    }
    if (this.matchToken(TokenType.LeftParen)) {
      const firstParen = this.previous();
      const expr = this.expression();
      this.consume(TokenType.RightParen, "after grouping expression");
      const secondParen = this.previous();
      return new GroupingExpr(this.getLocation(), expr, {
        firstParen,
        secondParen
      });
    }
    if (this.matchToken(TokenType.LeftBracket)) {
      return this.bracketInsides();
    }
    throw new FailedToMatchPrimaryExpressionParsingError(this.getLocation());
  }
  /**
   * Handles the parsing of vector literals and range literals.
   */
  protected bracketInsides(): Expression {
    const startBracket = this.previous();
    // the openscad bison parser has a weird thing where it allows optional commas only if the brackets represent an empty vector
    // Good: [,,,,,,]
    // Bad: [,,,,10]
    // Bad [,,,,,10: 20 : 20]
    const uselessCommaTokens: Token[] = [];
    if (this.consumeUselessCommas(uselessCommaTokens)) {
      this.consume(
        TokenType.RightBracket,
        "after leading commas in a vector literal"
      );
      const secondBracket = this.previous();
      return new VectorExpr(startBracket.pos, [], {
        firstBracket: startBracket,
        secondBracket,
        commas: uselessCommaTokens
      });
    }

    if (this.matchToken(TokenType.RightBracket)) {
      const secondBracket = this.previous();
      return new VectorExpr(startBracket.pos, [], {
        firstBracket: startBracket,
        commas: [],
        secondBracket
      });
    }

    const first = this.listComprehensionElementsOrExpr();
    // check if we are parsing a range
    if (
      !(first instanceof ListComprehensionExpression) &&
      this.matchToken(TokenType.Colon)
    ) {
      const firstColon = this.previous();
      let secondRangeExpr = this.expression();
      let thirdRangeExpr = null;
      let secondColon = null;
      if (this.matchToken(TokenType.Colon)) {
        secondColon = this.previous();
        thirdRangeExpr = this.expression();
      }
      this.consume(
        TokenType.RightBracket,
        "after expression in a range literal"
      );
      const secondBracket = this.previous();
      if (thirdRangeExpr) {
        return new RangeExpr(
          first.pos,
          first,
          secondRangeExpr,
          thirdRangeExpr,
          {
            firstBracket: startBracket,
            firstColon,
            secondColon,
            secondBracket
          }
        );
      } else {
        return new RangeExpr(first.pos, first, null, secondRangeExpr, {
          firstBracket: startBracket,
          firstColon,
          secondColon,
          secondBracket
        });
      }
    }

    // we are parsing a vector expression
    const vectorLiteral = new VectorExpr(startBracket.pos, [first], {
      commas: [],
      firstBracket: startBracket,
      secondBracket: null
    });
    if (this.matchToken(TokenType.Comma)) {
      this.consumeUselessCommas(vectorLiteral.tokens.commas);
      if (this.matchToken(TokenType.RightBracket)) {
        vectorLiteral.tokens.secondBracket = this.previous();
        return vectorLiteral;
      }
      while (true) {
        if (this.isAtEnd()) {
          throw new UnterminatedVectorExpressionParsingError(
            this.getLocation()
          );
        }

        vectorLiteral.children.push(this.listComprehensionElementsOrExpr());
        if (this.matchToken(TokenType.RightBracket)) {
          vectorLiteral.tokens.secondBracket = this.previous();
          break;
        }
        this.consume(TokenType.Comma, "after vector literal element");
        this.consumeUselessCommas(vectorLiteral.tokens.commas);
        if (this.matchToken(TokenType.RightBracket)) {
          vectorLiteral.tokens.secondBracket = this.previous();
          break;
        }
      }
    } else {
      vectorLiteral.tokens.secondBracket = this.previous();
      this.consume(
        TokenType.RightBracket,
        "after the only vector expression element"
      );
    }

    return vectorLiteral;
  }
  protected listComprehensionElements(): Expression {
    if (this.matchToken(TokenType.Let)) {
      const letKwrd = this.previous();
      this.consume(TokenType.LeftParen, "after the let keyword");
      const firstParen = this.previous();
      const args = this.args();
      const secondParen = this.previous();
      const next = this.listComprehensionElementsOrExpr();
      return new LcLetExpr(letKwrd.pos, args, next, {
        letKeyword: letKwrd,
        firstParen,
        secondParen
      });
    }
    if (this.matchToken(TokenType.Each)) {
      const eachKwrd = this.previous();
      const next = this.listComprehensionElementsOrExpr();
      return new LcEachExpr(eachKwrd.pos, next, {
        eachKeyword: eachKwrd
      });
    }
    if (this.matchToken(TokenType.For)) {
      return this.listComprehensionFor();
    }
    if (this.matchToken(TokenType.If)) {
      const ifKwrd = this.previous();
      this.consume(TokenType.LeftParen, "after the if keyword");
      const firstParen = this.previous();
      const cond = this.expression();
      this.consume(
        TokenType.RightParen,
        "after the if comprehension condition"
      );
      const secondParen = this.previous();
      const thenBranch = this.listComprehensionElementsOrExpr();
      let elseBranch = null;
      let elseKeyword = null;
      if (this.matchToken(TokenType.Else)) {
        elseKeyword = this.previous();
        elseBranch = this.listComprehensionElementsOrExpr();
      }
      return new LcIfExpr(ifKwrd.pos, cond, thenBranch, elseBranch, {
        ifKeyword: ifKwrd,
        elseKeyword,
        firstParen,
        secondParen
      });
    }
  }
  protected listComprehensionFor(): Expression {
    const forKwrd = this.previous();
    this.consume(
      TokenType.LeftParen,
      "after for keyword in list comprehension"
    );
    const firstParen = this.previous();
    const firstArgs = this.forComprehensionArgs();
    if (this.matchToken(TokenType.RightParen)) {
      const secondParen = this.previous();
      return new LcForExpr(
        forKwrd.pos,
        firstArgs,
        this.listComprehensionElementsOrExpr(),
        {
          forKeyword: forKwrd,
          firstParen,
          secondParen
        }
      );
    }
    this.consume(
      TokenType.Semicolon,
      "after first 'for' comprehension parameters"
    );
    const firstSemicolon = this.previous();
    const condition = this.expression();
    this.consume(TokenType.Semicolon, "after 'for' comprehension condition");
    const secondSemicolon = this.previous();
    const secondArgs = this.forComprehensionArgs();
    this.consume(
      TokenType.RightParen,
      "after second 'for' comprehension parameters"
    );
    const secondParen = this.previous();
    const next = this.listComprehensionElementsOrExpr();
    return new LcForCExpr(forKwrd.pos, firstArgs, secondArgs, condition, next, {
      firstParen,
      forKeyword: forKwrd,
      firstSemicolon,
      secondParen,
      secondSemicolon
    });
  }
  protected listComprehensionElementsOrExpr(): Expression {
    // checks if we have a list comprehension element.
    if (
      listComprehensionElementKeywords.includes(this.peek().type) ||
      (this.peek().type === TokenType.LeftParen &&
        listComprehensionElementKeywords.includes(this.peekNext().type))
    ) {
      let withParens = false;

      if (this.matchToken(TokenType.LeftParen)) {
        withParens = true;
      }
      const comprElemsResult = this.listComprehensionElements();
      if (withParens) {
        this.consume(
          TokenType.RightParen,
          "after parenthesized list comprehension expression"
        );
      }
      return comprElemsResult;
    }

    return this.expression();
  }
  protected consume(tt: TokenType, where: string) {
    if (this.checkToken(tt)) {
      return this.advance();
    }
    throw new ConsumptionParsingError(
      this.getLocation(),
      this.peek().type,
      tt,
      where
    );
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
