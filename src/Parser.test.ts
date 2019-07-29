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
import { LiteralExpr, Expression } from "./ast/expressions";
import ASTNode from "./ast/ASTNode";
import CodeLocation from "./CodeLocation";

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
});
