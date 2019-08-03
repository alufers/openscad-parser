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
  VectorExpr
} from "./ast/expressions";
import ScadFile from "./ast/ScadFile";
import {
  BlockStmt,
  FunctionDeclarationStmt,
  IfElseStatement,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
  NoopStmt,
  UseStmt
} from "./ast/statements";
import AssignmentNode from "./ast/AssignmentNode";
import Token from "./Token";
import {
  NewLineExtraToken,
  MultiLineComment,
  SingleLineComment
} from "./extraTokens";
import TokenType from "./TokenType";
import { setFlagsFromString } from "v8";

export default class SimpleASTPrinter implements ASTVisitor<string> {
  visitScadFile(n: ScadFile): string {
    let source = "";
    for (const stmt of n.statements) {
      source += stmt.accept(this);
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
      source += ",";
    }

    if (n.tokens.semicolon) {
      source += this.stringifyExtraTokens(n.tokens.semicolon);
      source += ";\n";
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
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.stringifyExtraTokens(n.tokens.secondParen);
    source += ")";
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
    return source;
  }
  visitLcIfExpr(n: LcIfExpr): string {
    throw new Error("Method not implemented.");
  }
  visitLcEachExpr(n: LcEachExpr): string {
    throw new Error("Method not implemented.");
  }
  visitLcForExpr(n: LcForExpr): string {
    throw new Error("Method not implemented.");
  }
  visitLcForCExpr(n: LcForCExpr): string {
    throw new Error("Method not implemented.");
  }
  visitLcLetExpr(n: LcLetExpr): string {
    throw new Error("Method not implemented.");
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
    source += "use <" + n.filename + ">\n";
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
    source += n.child.accept(this);
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
      //   if (i < n.definitionArgs.length - 1) {
      //     source += ", ";
      //   }
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
    source += n.expr.accept(this);
    source += this.stringifyExtraTokens(n.tokens.semicolon);
    source += ";\n";
    return source;
  }
  visitBlockStmt(n: BlockStmt): string {
    let source = "";
    source += this.stringifyExtraTokens(n.tokens.firstBrace);
    source += "{\n";
    for (const stmt of n.children) {
      source += stmt.accept(this);
    }
    source += this.stringifyExtraTokens(n.tokens.secondBrace);
    source += "}\n";
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
    source += n.thenBranch.accept(this);
    if (n.tokens.elseKeyword) {
      source += this.stringifyExtraTokens(n.tokens.elseKeyword);
      source += "else";
      source += n.elseBranch.accept(this);
    }
    return source;
  }

  protected stringifyExtraTokens(token: Token) {
    return token.extraTokens
      .map(et => {
        if (et instanceof NewLineExtraToken) {
          return "\n";
        } else if (et instanceof MultiLineComment) {
          return "/*" + et.contents + "*/";
        } else if (et instanceof SingleLineComment) {
          return "//" + et.contents + "";
        }
        return "";
      })
      .reduce((prev, curr) => prev + curr, "");
  }
}
