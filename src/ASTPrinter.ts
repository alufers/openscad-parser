import AssignmentNode from "./ast/AssignmentNode";
import ASTVisitor from "./ast/ASTVisitor";
import {
  ArrayLookupExpr,
  AssertExpr,
  BinaryOpExpr,
  EchoExpr,
  FunctionCallExpr,
  GroupingExpr,
  LcEachExpr,
  LcForCExpr,
  LcForExpr,
  LcIfExpr,
  LcLetExpr,
  LetExpr,
  LiteralExpr,
  LookupExpr,
  MemberLookupExpr,
  RangeExpr,
  TernaryExpr,
  UnaryOpExpr,
  VectorExpr,
} from "./ast/expressions";
import ScadFile from "./ast/ScadFile";
import {
  BlockStmt,
  FunctionDeclarationStmt,
  IfElseStatement,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
  NoopStmt,
  UseStmt,
  Statement,
} from "./ast/statements";
import {
  MultiLineComment,
  NewLineExtraToken,
  SingleLineComment,
} from "./extraTokens";
import Token from "./Token";
import TokenType from "./TokenType";
import { statement } from "@babel/template";
import FormattingConfiguration from "./FormattingConfiguration";

export default class ASTPrinter implements ASTVisitor<string> {
  indentLevel = 0;
  breakBetweenModuleInstantations = false;
  firstModuleInstantation = true;
  /**
   * We store data that is global between all the copies of the ASTPrinter in an object so that it is passed by reference.
   */
  deepGlobals = {
    didAddNewline: false,
  };

  constructor(public config: FormattingConfiguration) {}

  visitScadFile(n: ScadFile): string {
    let source = "";
    for (const stmt of n.statements) {
      source += this.processStatementWithBreakIfNeeded(stmt);
    }
    source += this.stringifyExtraTokens(n.tokens.eot);
    return source;
  }
  visitAssignmentNode(n: AssignmentNode): string {
    let source = "";
    if (n.name) {
      source += this.stringifyExtraTokens(n.tokens.name);
      source += n.name;
      if (n.tokens.equals) {
        source += this.stringifyExtraTokens(n.tokens.equals);
        source += " = ";
      }
    }

    if (n.value) {
      source += n.value.accept(this);
    }

    if (n.tokens.trailingCommas && n.tokens.trailingCommas.length > 0) {
      for (const tc of n.tokens.trailingCommas) {
        source += this.stringifyExtraTokens(tc);
      }
      source += ", ";
    }

    if (n.tokens.semicolon) {
      source += this.stringifyExtraTokens(n.tokens.semicolon);
      source += ";" + this.newLine(false, "afterAssignment");
    }

    return source;
  }
  visitUnaryOpExpr(n: UnaryOpExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.operator);
    if (n.operation === TokenType.Bang) {
      source += "!";
    } else if (n.operation === TokenType.Plus) {
      source += "+";
    } else if (n.operation === TokenType.Minus) {
      source += "-";
    }
    source += n.right.accept(this);
    return source;
  }
  visitBinaryOpExpr(n: BinaryOpExpr): string {
    let source = "";
    source += n.left.accept(this);
    source += this.stringifyExtraTokens(n.tokens.operator);
    source += " ";
    if (n.operation === TokenType.Star) {
      source += "*";
    } else if (n.operation === TokenType.Slash) {
      source += "/";
    } else if (n.operation === TokenType.Percent) {
      source += "%";
    } else if (n.operation === TokenType.Less) {
      source += "<";
    } else if (n.operation === TokenType.LessEqual) {
      source += "<=";
    } else if (n.operation === TokenType.Greater) {
      source += ">";
    } else if (n.operation === TokenType.GreaterEqual) {
      source += ">=";
    } else if (n.operation === TokenType.AND) {
      source += "&&";
    } else if (n.operation === TokenType.OR) {
      source += "||";
    } else if (n.operation === TokenType.EqualEqual) {
      source += "==";
    } else if (n.operation === TokenType.BangEqual) {
      source += "!=";
    } else if (n.operation === TokenType.Plus) {
      source += "+";
    } else if (n.operation === TokenType.Minus) {
      source += "-";
    }
    source += " ";
    source += n.right.accept(this);
    return source;
  }
  visitTernaryExpr(n: TernaryExpr): string {
    let source = "";
    source += n.cond.accept(this);
    source += this.stringifyExtraTokens(n.tokens.questionMark);
    source += " ? ";
    source += n.ifExpr.accept(this);
    source += this.stringifyExtraTokens(n.tokens.colon);
    source += " : ";
    source += n.elseExpr.accept(this);
    return source;
  }
  visitArrayLookupExpr(n: ArrayLookupExpr): string {
    let source = "";
    source += n.array.accept(this);
    source += this.stringifyExtraTokens(n.tokens.firstBracket);
    source += "[";
    source += n.index.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitLiteralExpr(n: LiteralExpr<any>): string {
    let source = "";

    source += this.stringifyExtraTokens(n.tokens.literalToken);
    if (n.value === null) {
      source += "undef";
    } else if (typeof n.value === "string") {
      source += JSON.stringify(n.value); // TODO: change to a custom stringification function
    } else {
      source += n.value;
    }

    return source;
  }
  visitRangeExpr(n: RangeExpr): string {
    let source = "";

    source += this.stringifyExtraTokens(n.tokens.firstBracket);
    source += "[";

    source += n.begin.accept(this);
    source += this.stringifyExtraTokens(n.tokens.firstColon);
    source += " : ";
    if (n.step) {
      source += n.step.accept(this);
      source += this.stringifyExtraTokens(n.tokens.secondColon);
      source += " : ";
    }
    source += n.end.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitVectorExpr(n: VectorExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.firstBracket);
    source += "[";
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      source += child.accept(this);
      if (i < n.children.length - 1) {
        source += ", ";
      }
    }
    source += this.stringifyExtraTokens(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitLookupExpr(n: LookupExpr): string {
    let source = "";

    source += this.stringifyExtraTokens(n.tokens.identifier);
    source += n.name;

    return source;
  }
  visitMemberLookupExpr(n: MemberLookupExpr): string {
    let source = "";
    source += n.expr.accept(this);
    source += this.stringifyExtraTokens(n.tokens.dot);
    source += ".";
    source += this.stringifyExtraTokens(n.tokens.memberName);
    source += n.member;

    return source;
  }
  visitFunctionCallExpr(n: FunctionCallExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += n.name;
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitLetExpr(n: LetExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += "let";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this.copyWithIndent());
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    source += " ";
    source += n.expr.accept(this);
    return source;
  }
  visitAssertExpr(n: AssertExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += "assert";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    source += " ";
    source += n.expr.accept(this);
    return source;
  }
  visitEchoExpr(n: EchoExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += "echo";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    source += " ";
    source += n.expr.accept(this);
    return source;
  }
  visitLcIfExpr(n: LcIfExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.ifKeyword);
    source += "if";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    source += n.cond.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ") ";
    source += n.ifExpr.accept(this);
    if (n.elseExpr) {
      source += this.stringifyExtraTokens(n.tokens.elseKeyword);
      source += " else ";
      source += n.elseExpr.accept(this);
    }

    return source;
  }
  visitLcEachExpr(n: LcEachExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.eachKeyword);
    source += "each ";
    source += n.expr.accept(this);
    return source;
  }
  visitLcForExpr(n: LcForExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.forKeyword);
    source += "for";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ") ";
    source += n.expr.accept(this);

    return source;
  }
  visitLcForCExpr(n: LcForCExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.forKeyword);
    source += "for";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.firstSemicolon);
    source += "; ";
    source += n.cond.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondSemicolon);
    source += "; ";
    for (let i = 0; i < n.incrArgs.length; i++) {
      const arg = n.incrArgs[i];
      source += arg.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ") ";
    source += n.expr.accept(this);

    return source;
  }
  visitLcLetExpr(n: LcLetExpr): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.letKeyword);
    source += "let";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ") ";
    source += n.expr.accept(this);

    return source;
  }
  visitGroupingExpr(n: GroupingExpr): string {
    let source = "";

    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    source += n.inner.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitUseStmt(n: UseStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.useKeyword);
    source += "use <" + n.filename + ">" + this.newLine();
    return source;
  }
  visitModuleInstantiationStmt(n: ModuleInstantiationStmt): string {
    let source = "";
    if (n.tagHighlight) {
      source += "#";
    }
    if (n.tagDisabled) {
      source += "*";
    }
    if (n.tagBackground) {
      source += "%";
    }
    if (n.tagRoot) {
      source += "!";
    }
    if (source != "") {
      source += " ";
    }
    source += this.stringifyExtraTokens(n.tokens.name);
    source += n.name;
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    if (!(n.child instanceof NoopStmt)) {
      source += " ";
    }
    if (this.breakBetweenModuleInstantations) {
      if (n.child instanceof ModuleInstantiationStmt) {
        let c = this as ASTPrinter;
        if (this.firstModuleInstantation) {
          c = this.copyWithIndent();
          c.firstModuleInstantation = false;
        }
        source +=
          c.newLine(false, "breakBetweenModuleInstantations") +
          n.child.accept(c);
      } else {
        const c = this.copyWithBreakBetweenModuleInstantations(false);
        c.firstModuleInstantation = true;
        source += n.child.accept(c);
      }
    } else {
      let c: ASTPrinter = this;
      if (n.child instanceof ModuleInstantiationStmt) {
        if (
          this.firstModuleInstantation &&
          n.child.tokens.name.hasNewlineInExtraTokens()
        ) {
          c = this.copyWithIndent();
          c.firstModuleInstantation = false;
        }
      } else {
        c.firstModuleInstantation = true;
      }
      source += n.child.accept(c);
    }
    return source;
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.moduleKeyword);
    source += "module ";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += n.name;
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.definitionArgs.length; i++) {
      const arg = n.definitionArgs[i];
      source += arg.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ") ";
    source += n.stmt.accept(this);
    return source;
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.functionKeyword);
    source += "function ";
    source += this.stringifyExtraTokens(n.tokens.name);
    source += n.name;
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.definitionArgs.length; i++) {
      const arg = n.definitionArgs[i];
      source += arg.accept(this);
      //   if (i < n.definitionArgs.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    source += this.stringifyExtraTokens(n.tokens.equals);
    source += " = ";
    source += n.expr.accept(this.copyWithIndent());
    source += this.stringifyExtraTokens(n.tokens.semicolon);
    source += ";" + this.newLine(false, "afterFunctionDeclaration");
    return source;
  }
  visitBlockStmt(n: BlockStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.firstBrace);
    const withIndent = this.copyWithIndent();
    source += "{" + withIndent.newLine(false, "beforeBlockStmt");
    for (const stmt of n.children) {
      source += withIndent.processStatementWithBreakIfNeeded(stmt);
    }
    source += withIndent.stringifyExtraTokens(n.tokens.secondBrace);
    // erease indentation
    if (
      n.tokens.secondBrace.extraTokens[
        n.tokens.secondBrace.extraTokens.length - 1
      ] instanceof NewLineExtraToken
    ) {
      source = source.substring(0, source.length - this.config.indentCount);
    }
    source += "}" + this.newLine(false, "afterBlockStmt");
    return source;
  }
  visitNoopStmt(n: NoopStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.semicolon);
    source += ";";
    return source;
  }
  visitIfElseStatement(n: IfElseStatement): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.ifKeyword);
    source += "if";
    source += this.stringifyExtraTokens(n.tokens.firstParen);
    source += "(";
    source += n.cond.accept(this);
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
    if (!(n.thenBranch instanceof NoopStmt)) {
      source += " ";
    }
    source += n.thenBranch.accept(this);
    if (n.tokens.elseKeyword) {
      source += this.stringifyExtraTokens(n.tokens.elseKeyword);
      source += "else";
      if (!(n.elseBranch instanceof NoopStmt)) {
        source += " ";
      }
      source += n.elseBranch.accept(this);
    }
    return source;
  }

  /**
   * Tries printing a ModuleInstantiationStmt without breaking it, if it exceeds 40 chars it breaks it, by printing it again.
   * @param stmt
   */
  protected processStatementWithBreakIfNeeded(stmt: Statement) {
    if (stmt instanceof ModuleInstantiationStmt) {
      const saved = this.saveDeepGlobals();
      const line = stmt.accept(this);
      const firstRealLine = line
        .split("\n")
        .find((l) => !!l.split("//")[0].trim());
      if (firstRealLine.length > this.config.moduleInstantiationBreakLength) {
        this.restoreDeepGlobals(saved);
        return stmt.accept(this.copyWithBreakBetweenModuleInstantations());
      }
      return line;
    } else {
      return stmt.accept(this);
    }
  }

  protected stringifyExtraTokens(token: Token) {
    const source = token.extraTokens
      .map((et) => {
        if (et instanceof NewLineExtraToken) {
          if (this.deepGlobals.didAddNewline) {
            this.deepGlobals.didAddNewline = false;
            return "";
          }
          return this.newLine(true, "forcedNewlineExtraToken");
        } else if (et instanceof MultiLineComment) {
          return "/*" + et.contents + "*/";
        } else if (et instanceof SingleLineComment) {
          return "//" + et.contents + "";
        }
        return "";
      })
      .reduce((prev, curr) => prev + curr, "");
    this.deepGlobals.didAddNewline = false;
    return source;
  }
  protected newLine(forced = false, newlineReason = "no reason") {
    if (!forced) {
      this.deepGlobals.didAddNewline = true;
    }
    if (this.config.debugNewlines) {
      return `   /* NL: ${newlineReason} */` + "\n" + this.makeIndent();
    }
    return "\n" + this.makeIndent();
  }
  protected makeIndent() {
    let ind = "";
    for (let i = 0; i < this.indentLevel * this.config.indentCount; i++) {
      ind += this.config.indentChar;
    }
    return ind;
  }
  protected copy() {
    const next = new ASTPrinter(this.config);
    next.indentLevel = this.indentLevel;
    next.deepGlobals = this.deepGlobals;
    next.breakBetweenModuleInstantations = this.breakBetweenModuleInstantations;
    return next;
  }
  protected copyWithIndent() {
    const next = this.copy();
    next.indentLevel++;
    return next;
  }
  protected copyWithBreakBetweenModuleInstantations(doBreak = true) {
    const next = this.copy();
    next.breakBetweenModuleInstantations = doBreak;
    return next;
  }
  protected saveDeepGlobals() {
    return JSON.parse(JSON.stringify(this.deepGlobals));
  }
  protected restoreDeepGlobals(dat: any) {
    for (const k of Object.keys(dat)) {
      (this.deepGlobals as any)[k] = dat[k];
    }
  }
}
