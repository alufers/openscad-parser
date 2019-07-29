import Lexer from "./Lexer";
import CodeFile from "./CodeFile";
import Parser from "./Parser";
import {
  UseStmt,
  BlockStmt,
  NoopStmt,
  ModuleDeclarationStmt,
  ModuleInstantiationStmt,
  IfElseStatement
} from "./ast/statements";
import ParsingError from "./ParsingError";
import AssignmentNode from "./ast/AssignmentNode";
import {
  LiteralExpr,
  Expression,
  MemberLookup,
  ArrayLookupExpr,
  FunctionCallExpr,
  BinaryOpExpr,
  UnaryOpExpr,
  TernaryExpr
} from "./ast/expressions";
import ASTNode from "./ast/ASTNode";
import CodeLocation from "./CodeLocation";
import TokenType from "./TokenType";

describe("Parser", () => {
  function doParse(source: string) {
    const l = new Lexer(new CodeFile("<test>", source));
    const parser = new Parser(l.codeFile, l.scan());
    return parser.parse();
  }
  /**
   * Recursively removes codeLocations from the ast tree.
   * @param ast an ast node to simplify
   */
  function simplifyAst(ast: ASTNode) {
    return JSON.parse(
      JSON.stringify(ast, (key, value) => {
        if (value instanceof CodeLocation || value instanceof CodeFile) {
          return null;
        }
        if (value && typeof value === "object") {
          const proto = Object.getPrototypeOf(value);
          if (proto && proto.constructor && proto.constructor.name) {
            value.__c = proto.constructor.name;
          }
        }
        return value;
      })
    );
  }
  it("parses basic use statements", () => {
    const scadFile = doParse(`
    use <myfile.scad>
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(UseStmt);
    expect((scadFile.statements[0] as UseStmt).filename).toEqual("myfile.scad");
  });
  it("parses use statements with spaces and weird symbols in the path", () => {
    const scadFile = doParse(`
    use <000988 eeeee 13-2/../92_3333.scad>
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(UseStmt);
    expect((scadFile.statements[0] as UseStmt).filename).toEqual(
      "000988 eeeee 13-2/../92_3333.scad"
    );
  });
  it("throws on unterminated use statements", () => {
    expect(() =>
      doParse(`
    use <ty
    `)
    ).toThrow(ParsingError);
  });
  it("parses block statements", () => {
    const scadFile = doParse(`
    {}
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(BlockStmt);
    expect(scadFile.statements).toHaveLength(1);
  });
  it("parses nested block statements and noop statements", () => {
    const scadFile = doParse(`
    {{;}}
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(BlockStmt);
    expect((scadFile.statements[0] as BlockStmt).children[0]).toBeInstanceOf(
      BlockStmt
    );
    expect(
      ((scadFile.statements[0] as BlockStmt).children[0] as BlockStmt)
        .children[0]
    ).toBeInstanceOf(NoopStmt);
  });
  it("throws on unterminated block statements", () => {
    expect(() =>
      doParse(`
        {
    `)
    ).toThrow(ParsingError);
  });
  it("parses module declarations", () => {
    const scadFile = doParse(`
    module testmod() {
      
    }
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(ModuleDeclarationStmt);
    const decl = scadFile.statements[0] as ModuleDeclarationStmt;
    expect(decl.name).toEqual("testmod");
  });
  it("parses module declarations with parameters", () => {
    const scadFile = doParse(`
    module testmod(abc) {
      
    }
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(ModuleDeclarationStmt);
    const decl = scadFile.statements[0] as ModuleDeclarationStmt;
    expect(decl.definitionArgs.length).toEqual(1);
    expect(decl.definitionArgs[0].name).toEqual("abc");
  });
  it("parses module declarations with multiple parameters", () => {
    const scadFile = doParse(`
    module testmod(abc, gfg) {
      
    }
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(ModuleDeclarationStmt);
    const decl = scadFile.statements[0] as ModuleDeclarationStmt;
    expect(decl.definitionArgs.length).toEqual(2);
    expect(decl.definitionArgs[0].name).toEqual("abc");
    expect(decl.definitionArgs[1].name).toEqual("gfg");
  });

  it("parses module declarations with multiple parameters and weird commas", () => {
    const scadFile = doParse(`
    module testmod(,,,,abc,, gfg,,,) {
      
    }
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(ModuleDeclarationStmt);
    const decl = scadFile.statements[0] as ModuleDeclarationStmt;
    expect(decl.definitionArgs.length).toEqual(2);
    expect(decl.definitionArgs[0].name).toEqual("abc");
    expect(decl.definitionArgs[1].name).toEqual("gfg");
  });
  it("parses module declarations only commas in the parameters params", () => {
    const scadFile = doParse(`
    module testmod(,,,,,) {
      
    }
    `);
    expect(scadFile.statements[0]).toBeInstanceOf(ModuleDeclarationStmt);
    const decl = scadFile.statements[0] as ModuleDeclarationStmt;
    expect(decl.definitionArgs.length).toEqual(0);
  });
  it("throws on unterminated parameters lists in module declarations", () => {
    expect(() =>
      doParse(`
        module unterminated (
    `)
    ).toThrow(ParsingError);
  });
  it("throws on unexpected tokens in module declaration parameters", () => {
    expect(() =>
      doParse(`
        module unexpected (abc-) {}
    `)
    ).toThrow(ParsingError);
  });
  it("throws on garbage in module declaration parameters", () => {
    expect(() =>
      doParse(`
        module garbage (-) {}
    `)
    ).toThrow(ParsingError);

    expect(() =>
      doParse(`
        module garbage (==!>XDD) {}
    `)
    ).toThrow(ParsingError);
  });
  it("parses function declarations", () => {
    doParse(`
     function noop (x = false) = x;
  `);
  });
  it("parses assignments", () => {
    const file = doParse(`
      x = 10;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.name).toEqual("x");
    expect(a.value).toBeInstanceOf(LiteralExpr);
    expect(a.value).toHaveProperty("value", 10);
  });
  it("parses module instantiations", () => {
    const file = doParse(`
      cube();
    `);
    expect(file.statements[0]).toBeInstanceOf(ModuleInstantiationStmt);
    const inst = file.statements[0] as ModuleInstantiationStmt;
    expect(inst.name).toEqual("cube");
    expect(inst.args).toHaveLength(0);
    expect(inst.child).toBeInstanceOf(NoopStmt);
  });
  describe("tag parsing", () => {
    const tags: { [x: string]: keyof ModuleInstantiationStmt } = {
      "!": "tagRoot",
      "#": "tagHighlight",
      "%": "tagBackground",
      "*": "tagDisabled"
    };
    for (const tagToken of Object.keys(tags)) {
      it(`parses the '${tagToken}' tag`, () => {
        const file = doParse(`
          ${tagToken}cube();
       `);
        const inst = file.statements[0] as ModuleInstantiationStmt;
        expect(inst[tags[tagToken]]).toBeTruthy();
      });
    }
    it("parses all the tags", () => {
      const file = doParse(`
        !#%*cube();
      `);
      const inst = file.statements[0] as ModuleInstantiationStmt;
      expect(inst).toBeInstanceOf(ModuleInstantiationStmt);
      for (const tagToken of Object.keys(tags)) {
        expect(inst[tags[tagToken]]).toBeTruthy();
      }
    });
  });
  it("throws on identifiers that are neiither assignments nor module instantiations where statements are expected", () => {
    expect(() =>
      doParse(`
        dupa - 10;  
      `)
    ).toThrow(ParsingError);
  });
  it("parses module instantiations with simple children ", () => {
    const file = doParse(`
        union() cube();
    `);

    expect(file.statements[0]).toBeInstanceOf(ModuleInstantiationStmt);
    const inst = file.statements[0] as ModuleInstantiationStmt;
    expect(inst.name).toEqual("union");
    expect(inst.args).toHaveLength(0);
    expect(inst.child).toBeInstanceOf(ModuleInstantiationStmt);
    expect(inst.child).toHaveProperty("name", "cube");
    expect(inst.child).toHaveProperty("args", []);
  });
  it("parses module instantiations with block children ", () => {
    const file = doParse(`
        union() {
          cube();
          sphere();
        }
      `);

    expect(file.statements[0]).toBeInstanceOf(ModuleInstantiationStmt);
    const inst = file.statements[0] as ModuleInstantiationStmt;
    expect(inst.name).toEqual("union");
    expect(inst.child).toHaveProperty("children.length", 2);
    simplifyAst;
    expect(inst.child).toBeInstanceOf(BlockStmt);
    expect(inst.child).toHaveProperty(["children", 0, "name"], "cube");
    expect(inst.child).toHaveProperty(["children", 1, "name"], "sphere");
  });
  it("parses module instantiations with positional arguments", () => {
    expect(
      simplifyAst(
        doParse(`
          cube(true);
        `)
      )
    ).toMatchSnapshot();
  });
  it("parses module instantiations with mixed arguments", () => {
    expect(
      simplifyAst(
        doParse(`
          cube(true, r = 10);
        `)
      )
    ).toMatchSnapshot();
  });
  it("parses module instantiations which are also keywords", () => {
    const f = doParse(`
    for() {

    }
    let(x = 20) {

    }
    assert() {

    }
    echo("hello");
    each() {

    }
   `);
    expect(simplifyAst(f)).toMatchSnapshot();
  });
  it("parses simple if statements", () => {
    const file = doParse(`
      if("anything") {
        cube();
      }
    `);
    expect(file.statements[0]).toBeInstanceOf(IfElseStatement);
    expect(file.statements[0]).toHaveProperty("cond");
    expect((file.statements[0] as IfElseStatement).cond).toBeInstanceOf(
      Expression
    );
    expect((file.statements[0] as IfElseStatement).thenBranch).toBeInstanceOf(
      BlockStmt
    );
    expect((file.statements[0] as IfElseStatement).elseBranch).toBeNull();
  });
  it("parses if else statements", () => {
    const file = doParse(`
      if("anything") {
        cube();
      } else if("everything") sphere();
      else {
        echo("error");
      }
    `);
    expect(file.statements[0]).toBeInstanceOf(IfElseStatement);
    expect(file.statements[0]).toHaveProperty("cond");
    expect((file.statements[0] as IfElseStatement).cond).toBeInstanceOf(
      Expression
    );
    expect((file.statements[0] as IfElseStatement).thenBranch).toBeInstanceOf(
      BlockStmt
    );
    expect((file.statements[0] as IfElseStatement).elseBranch).toBeInstanceOf(
      IfElseStatement
    );
  });
  it("throws on if statements without a thgen branch", () => {
    expect(() =>
      doParse(`
        if(true)
      `)
    ).toThrow(ParsingError);
  });
  it("throws when a module instantiation has an unterminated argument list which may cause problems with lookahead", () => {
    expect(() =>
      doParse(`
       doSomething(abc
    `)
    ).toThrow(ParsingError);
  });
  it("parses member lookup expressions", () => {
    const file = doParse(`
      x = abc.y;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(MemberLookup);
    expect(a.value).toHaveProperty("expr.name", "abc");
    expect(a.value).toHaveProperty("member", "y");
  });
  it("throws on unterminated member expressions", () => {
    expect(() =>
      doParse(`
       mem = x.
    `)
    ).toThrow(ParsingError);
  });
  it("parses array lookup expressions", () => {
    const file = doParse(`
      x = arr[10];
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(ArrayLookupExpr);
    expect(a.value).toHaveProperty("array.name", "arr");
    expect(a.value).toHaveProperty("index.value", 10);
  });
  it("throws on unterminated array lookup expressions", () => {
    expect(() =>
      doParse(`
       val = arr[10
    `)
    ).toThrow(ParsingError);
  });
  it("parses function call expressions", () => {
    const file = doParse(`
      x = fun();
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(FunctionCallExpr);
    expect(a.value).toHaveProperty("name", "fun");
    expect(a.value).toHaveProperty("args.length", 0);
  });
  it("parses function call expressions with positional and named arguments", () => {
    const file = doParse(`
      x = fun(arg1, arg2 = 8, arg3 = undef);
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(FunctionCallExpr);
    expect(a.value).toHaveProperty("args.length", 3);
    expect(a.value).toHaveProperty("args.0.name", "");
    expect(a.value).toHaveProperty("args.0.value.name", "arg1");
    expect(a.value).toHaveProperty("args.1.name", "arg2");
    expect(a.value).toHaveProperty("args.1.value.value", 8);
    expect(a.value).toHaveProperty("args.2.name", "arg3");
    expect(a.value).toHaveProperty("args.2.value.value", null);
  });
  it("parses multiplication", () => {
    const file = doParse(`
      x = 10 * 6;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(BinaryOpExpr);
    expect(a.value).toHaveProperty("left.value", 10);
    expect(a.value).toHaveProperty("right.value", 6);
    expect(a.value).toHaveProperty("operation", TokenType.Star);
  });
  it("parses multiplication and division in one expression", () => {
    const file = doParse(`
      x = 10 * 6 / 5;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(BinaryOpExpr);
    expect(a.value).toHaveProperty("left.left.value", 10);
    expect(a.value).toHaveProperty("left.operation", TokenType.Star);
    expect(a.value).toHaveProperty("left.right.value", 6);
    expect(a.value).toHaveProperty("right.value", 5);
    expect(a.value).toHaveProperty("operation", TokenType.Slash);
  });
  it("parses addition and subtraction", () => {
    const file = doParse(`
      x = 10 + 18 - 33;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(simplifyAst(a.value)).toMatchSnapshot();
  });
  it("parses addition and multiplication with grouping expression", () => {
    const file = doParse(`
      x = (88 + 3) / 10;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(simplifyAst(a.value)).toMatchSnapshot();
  });
  it("parses addition and multiplication without grouping expression", () => {
    const file = doParse(`
      x = 88 + 3 / 10;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(simplifyAst(a.value)).toMatchSnapshot();
  });
  it("parses the '-' unary operator", () => {
    const file = doParse(`
      x = -10;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(UnaryOpExpr);
    const unary = a.value as UnaryOpExpr;
    expect(unary.operation).toEqual(TokenType.Minus);
    expect(unary).toHaveProperty("right.value", 10);
  });
  it("parses the '!' unary operator", () => {
    const file = doParse(`
      x = !22;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(UnaryOpExpr);
    const unary = a.value as UnaryOpExpr;
    expect(unary.operation).toEqual(TokenType.Bang);
    expect(unary).toHaveProperty("right.value", 22);
  });
  it("parses the '+' unary operator", () => {
    const file = doParse(`
      x = +32;
    `);
    expect(file.statements[0]).toBeInstanceOf(AssignmentNode);
    const a = file.statements[0] as AssignmentNode;
    expect(a.value).toBeInstanceOf(UnaryOpExpr);
    const unary = a.value as UnaryOpExpr;
    expect(unary.operation).toEqual(TokenType.Plus);
    expect(unary).toHaveProperty("right.value", 32);
  });
  it("parses comparsion operators", () => {
    const file = doParse(`
      if(x > 2) {

      }
      if(x >= 5) {

      }
      if(x <= 5) {

      }
      if(x < 8) {

      }
    `);
    expect(file.statements[0]).toBeInstanceOf(IfElseStatement);
    const i = file.statements[0] as IfElseStatement;
    expect(i.cond).toBeInstanceOf(BinaryOpExpr);
    expect(i.cond).toHaveProperty("operation", TokenType.Greater);
    expect(file.statements).toHaveProperty(
      [1, "cond", "operation"],
      TokenType.GreaterEqual
    );
    expect(file.statements).toHaveProperty(
      [2, "cond", "operation"],
      TokenType.LessEqual
    );
    expect(file.statements).toHaveProperty(
      [3, "cond", "operation"],
      TokenType.Less
    );
  });
  it("parses equality operators", () => {
    const file = doParse(`
      if(x > 2 == false) {

      }
      if(x > 2 != false) {

      }
    `);
    expect(file.statements).toHaveProperty(
      [0, "cond", "operation"],
      TokenType.EqualEqual
    );
    expect(file.statements).toHaveProperty(
      [1, "cond", "operation"],
      TokenType.BangEqual
    );
  });
  it("parses logical operators", () => {
    const file = doParse(`
      if(x > 2 == false && x < 25) {

      }
      if(x > 2 != false || y != 3) {

      }
    `);
    expect(file.statements).toHaveProperty(
      [0, "cond", "operation"],
      TokenType.AND
    );
    expect(file.statements).toHaveProperty(
      [1, "cond", "operation"],
      TokenType.OR
    );
  });
  it("parses logical operators with the correct precedence", () => {
    const file = doParse(`
      if(true && false || undef) {

      }
      if(true || false && undef) {

      }

    `);
    expect(file.statements).toHaveProperty(
      [0, "cond", "operation"],
      TokenType.OR
    );
    expect(file.statements).toHaveProperty(
      [1, "cond", "operation"],
      TokenType.OR
    );
  });
  it("parses the ternary operator", () => {
    const file = doParse(`
      x = a ? b : c;
    `);
    expect(file.statements[0]).toHaveProperty("value.cond");
    expect(file.statements[0]).toHaveProperty("value.ifExpr");
    expect(file.statements[0]).toHaveProperty("value.ifExpr.name", "b");
    expect(file.statements[0]).toHaveProperty("value.elseExpr.name", "c");
  });
  it("parses nested ternary operators", () => {
    const file = doParse(`
      x = a ? x ? d : u : c;
    `);
    expect(file.statements[0]).toHaveProperty("value.cond");
    expect(file.statements[0]).toHaveProperty("value.ifExpr");
    expect(file.statements[0]).toHaveProperty("value.ifExpr.cond.name", "x");
    expect(file.statements[0]).toHaveProperty("value.ifExpr.ifExpr.name", "d");
    expect(file.statements[0]).toHaveProperty("value.elseExpr.name", "c");
  });
  it("throws on unterminated ternary operator", () => {
    expect(() =>
      doParse(`
       val = cond ? dup
    `)
    ).toThrow(ParsingError);
  });
});
