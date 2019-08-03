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
import {
  CodePart,
  UnconditionalNewLineCodePart,
  StringCodePart,
  NoOpCodePart,
  CodeList,
  CodePartSeparation,
  CodeGroup
} from "./parts/codeParts";

export default class ASTToCodePartsConverter implements ASTVisitor<CodePart> {
  indentation = 0;
  visitScadFile(n: ScadFile): CodePart {
    const part = new CodeList([]);
    for (const stmt of n.statements) {
      part.children.push(stmt.accept(this));
    }
    part.children = part.children.concat(
      this.extraTokensToCodeParts(n.tokens.eot)
    );
    return part;
  }
  visitAssignmentNode(n: AssignmentNode): CodePart {
    const part = n.tokens.semicolon ? new CodeList([]) : new CodeGroup([], 0);
    if (n.name) {
      part.children = part.children.concat(
        this.extraTokensToCodeParts(n.tokens.name)
      );
      part.children.push(new StringCodePart(n.name));
      if (n.tokens.equals) {
        part.children = part.children.concat(
          this.extraTokensToCodeParts(n.tokens.equals)
        );
        part.children.push(
          new StringCodePart("=").withSeparation(CodePartSeparation.Both)
        );
      }
    }

    if (n.value) {
      part.children.push(n.value.accept(this));
    }

    if (n.tokens.trailingCommas && n.tokens.trailingCommas.length > 0) {
      for (const tc of n.tokens.trailingCommas) {
        part.children = part.children.concat(this.extraTokensToCodeParts(tc));
      }
      part.children.push(
        new StringCodePart("=").withSeparation(CodePartSeparation.Right)
      );
    }

    if (n.tokens.semicolon) {
      part.children = part.children.concat(
        this.extraTokensToCodeParts(n.tokens.semicolon)
      );
      part.children.push(
        new StringCodePart(";").withSeparation(CodePartSeparation.Right)
      );
    }

    return source;
  }
  visitUnaryOpExpr(n: UnaryOpExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.operator);
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
    source += this.extraTokensToCodeParts(n.tokens.operator);
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
    source += this.extraTokensToCodeParts(n.tokens.questionMark);
    source += " ? ";
    source += n.ifExpr.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.colon);
    source += " : ";
    source += n.elseExpr.accept(this);
    return source;
  }
  visitArrayLookupExpr(n: ArrayLookupExpr): string {
    let source = "";
    source += n.array.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.firstBracket);
    source += "[";
    source += n.index.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitLiteralExpr(n: LiteralExpr<any>): string {
    let source = "";

    source += this.extraTokensToCodeParts(n.tokens.literalToken);
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

    source += this.extraTokensToCodeParts(n.tokens.firstBracket);
    source += "[";

    source += n.begin.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.firstColon);
    source += " : ";
    if (n.step) {
      source += n.step.accept(this);
      source += this.extraTokensToCodeParts(n.tokens.secondColon);
      source += " : ";
    }
    source += n.end.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitVectorExpr(n: VectorExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.firstBracket);
    source += "[";
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      source += child.accept(this);
      if (i < n.children.length - 1) {
        source += ", ";
      }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondBracket);
    source += "]";
    return source;
  }
  visitLookupExpr(n: LookupExpr): string {
    let source = "";

    source += this.extraTokensToCodeParts(n.tokens.identifier);
    source += n.name;

    return source;
  }
  visitMemberLookupExpr(n: MemberLookupExpr): string {
    let source = "";
    source += n.expr.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.dot);
    source += ".";
    source += this.extraTokensToCodeParts(n.tokens.memberName);
    source += n.member;

    return source;
  }
  visitFunctionCallExpr(n: FunctionCallExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += n.name;
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitLetExpr(n: LetExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += "let";
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitAssertExpr(n: AssertExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += "assert";
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitEchoExpr(n: EchoExpr): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += "echo";
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
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

    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    source += n.inner.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    return source;
  }
  visitUseStmt(n: UseStmt): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.useKeyword);
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
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += n.name;
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.args.length; i++) {
      const arg = n.args[i];
      source += arg.accept(this);
      //   if (i < n.args.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    if (!(n.child instanceof NoopStmt)) {
      source += " ";
    }
    source += n.child.accept(this);
    return source;
  }
  visitModuleDeclarationStmt(n: ModuleDeclarationStmt): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.moduleKeyword);
    source += "module ";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += n.name;
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.definitionArgs.length; i++) {
      const arg = n.definitionArgs[i];
      source += arg.accept(this);
      //   if (i < n.definitionArgs.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ") ";
    source += n.stmt.accept(this);
    return source;
  }
  visitFunctionDeclarationStmt(n: FunctionDeclarationStmt): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.functionKeyword);
    source += "function ";
    source += this.extraTokensToCodeParts(n.tokens.name);
    source += n.name;
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    for (let i = 0; i < n.definitionArgs.length; i++) {
      const arg = n.definitionArgs[i];
      source += arg.accept(this);
      //   if (i < n.definitionArgs.length - 1) {
      //     source += ", ";
      //   }
    }
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    source += this.extraTokensToCodeParts(n.tokens.equals);
    source += " = ";
    source += n.expr.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.semicolon);
    source += ";\n";
    return source;
  }
  visitBlockStmt(n: BlockStmt): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.firstBrace);
    source += "{\n";
    for (const stmt of n.children) {
      source += stmt.accept(this);
    }
    source += this.extraTokensToCodeParts(n.tokens.secondBrace);
    source += "}\n";
    return source;
  }
  visitNoopStmt(n: NoopStmt): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.semicolon);
    source += ";";
    return source;
  }
  visitIfElseStatement(n: IfElseStatement): string {
    let source = "";
    source += this.extraTokensToCodeParts(n.tokens.ifKeyword);
    source += "if";
    source += this.extraTokensToCodeParts(n.tokens.firstParen);
    source += "(";
    source += n.cond.accept(this);
    source += this.extraTokensToCodeParts(n.tokens.secondParen);
    source += ")";
    source += n.thenBranch.accept(this);
    if (n.tokens.elseKeyword) {
      source += this.extraTokensToCodeParts(n.tokens.elseKeyword);
      source += "else";
      source += n.elseBranch.accept(this);
    }
    return source;
  }

  protected extraTokensToCodeParts(token: Token): CodePart[] {
    return token.extraTokens.map(et => {
      if (et instanceof NewLineExtraToken) {
        return new UnconditionalNewLineCodePart();
      } else if (et instanceof MultiLineComment) {
        return new StringCodePart("/*" + et.contents + "*/");
      } else if (et instanceof SingleLineComment) {
        return new StringCodePart("//" + et.contents);
      }
      return new NoOpCodePart();
    });
  }
  protected createIndent() {
    let indent = "";
    for (let i = 0; i < this.indentation; i++) {
      indent += "  ";
    }
    return indent;
  }
  protected withIndentation(levelsToAdd: number) {
    const next = new SimpleASTPrinter();
    next.indentation = this.indentation + levelsToAdd;
    return next;
  }
}
