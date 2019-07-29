import Lexer from "./Lexer";
import CodeFile from "./CodeFile";
import TokenType from "./TokenType";
import LiteralToken from "./LiteralToken";
import LexingError from "./LexingError";
import { resolve } from "path";
import Token from "./Token";

function lexToTTStream(code: string) {
  const lexer = new Lexer(new CodeFile("<test>", code));
  return lexer.scan().map(token => token.type);
}

function lexTokens(code: string) {
  const lexer = new Lexer(new CodeFile("<test>", code));
  return lexer.scan();
}

function simplifyTokens(tokens: Token[]) {
  return tokens.map(token => {
    if (token instanceof LiteralToken) {
      return {
        val: token.value,
        posChar: token.pos.char,
        type: TokenType[token.type],
        l: token.lexeme
      };
    }
    return {
      posChar: token.pos.char,
      type: TokenType[token.type], // reverse lookup the token type so that it is easier to read the snaps
      l: token.lexeme
    };
  });
}

describe("Lexer", () => {
  it("constructs without crashing", () => {
    new Lexer(new CodeFile("asdf", "b"));
  });
  it("scans simple tokens", () => {
    const tts = lexToTTStream(`%`);
    expect(tts).toEqual([TokenType.Percent, TokenType.Eot]);
  });
  it("ignores whitespace", () => {
    const tts = lexToTTStream(`% {
        
    }`);
    expect(tts).toEqual([
      TokenType.Percent,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.Eot
    ]);
  });
  it("scans braces, parens and brackets", () => {
    const tts = lexToTTStream(`[]{}()`);
    expect(tts).toEqual([
      TokenType.LeftBracket,
      TokenType.RightBracket,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.LeftParen,
      TokenType.RightParen,
      TokenType.Eot
    ]);
  });
  it("scans braces, parens and brackets", () => {
    const tts = lexToTTStream(`[]{}()`);
    expect(tts).toEqual([
      TokenType.LeftBracket,
      TokenType.RightBracket,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.LeftParen,
      TokenType.RightParen,
      TokenType.Eot
    ]);
  });
  it("scans identifiers", () => {
    const tts = lexToTTStream(`abc;`);
    expect(tts).toEqual([
      TokenType.Identifier,
      TokenType.Semicolon,
      TokenType.Eot
    ]);
  });
  it("scans number literals", () => {
    const tts = lexToTTStream(`5;`);
    expect(tts).toEqual([
      TokenType.NumberLiteral,
      TokenType.Semicolon,
      TokenType.Eot
    ]);
  });
  it("scans string literals", () => {
    const tts = lexToTTStream(`"abc";`);
    expect(tts).toEqual([
      TokenType.StringLiteral,
      TokenType.Semicolon,
      TokenType.Eot
    ]);
  });

  it("scans && and ||", () => {
    const tts = lexToTTStream(`abc && ddd || afs;`);
    expect(tts).toEqual([
      TokenType.Identifier,
      TokenType.AND,
      TokenType.Identifier,
      TokenType.OR,
      TokenType.Identifier,
      TokenType.Semicolon,
      TokenType.Eot
    ]);
  });

  it("scans dots", () => {
    const tts = lexToTTStream(`abc.ddd;`);
    expect(tts).toEqual([
      TokenType.Identifier,
      TokenType.Dot,
      TokenType.Identifier,
      TokenType.Semicolon,
      TokenType.Eot
    ]);
  });
  it("scans hashes", () => {
    const tts = lexToTTStream(`#{}`);
    expect(tts).toEqual([
      TokenType.Hash,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.Eot
    ]);
  });
  it("throws LexingError on single & and single |", () => {
    expect(() => lexToTTStream(`&`)).toThrowError(LexingError);
    expect(() => lexToTTStream(`|`)).toThrowError(LexingError);
  });

  it("throws LexingError on unexpected characters", () => {
    expect(() => lexToTTStream(`~~~~~~`)).toThrowError(LexingError);
  });

  describe("number lexing", () => {
    function testNumberLexing(source: string) {
      const tokens = lexTokens(source);
      if (!(tokens[0] instanceof LiteralToken)) {
        throw new Error("First token is not a literal. Fix that test!");
      }

      return (tokens[0] as LiteralToken<number>).value;
    }
    it("lexes one digit numbers", () => {
      expect(testNumberLexing("9")).toEqual(9);
    });
    it("lexes zero", () => {
      expect(testNumberLexing("0")).toEqual(0);
      expect(testNumberLexing("0.0")).toEqual(0);
    });
    it("lexes numbers with multiple digits", () => {
      expect(testNumberLexing("786")).toEqual(786);
    });
    it("lexes numbers with decimal point", () => {
      expect(testNumberLexing("333.87")).toEqual(333.87);
    });
    it("lexes exponential numbers", () => {
      expect(testNumberLexing("20e10")).toEqual(20e10);
    });
    it("lexes exponential numbers with commas", () => {
      expect(testNumberLexing("2.787272e10")).toEqual(2.787272e10);
    });
    it("throws LexingError when an invalid number is given", () => {
      expect(() => testNumberLexing("2.2.2")).toThrowError(LexingError);
    });
    it("lexes numbers starting with a dot", () => {
      expect(testNumberLexing(".9")).toEqual(0.9);
    });
  });

  describe("string lexing", () => {
    function testStringLexing(source: string) {
      const tokens = lexTokens(source);
      if (!(tokens[0] instanceof LiteralToken)) {
        throw new Error("First token is not a literal. Fix that test!");
      }

      return (tokens[0] as LiteralToken<string>).value;
    }
    it("lexes simple strings", () => {
      expect(testStringLexing(`"hello"`)).toEqual("hello");
    });
    it("lexes empty strings", () => {
      expect(testStringLexing(`""`)).toEqual("");
    });
    it("lexes strings with escape sequences", () => {
      expect(testStringLexing(`"a\\nb\\t\\rc\\\\gg\\"g"`)).toEqual(
        'a\nb\t\rc\\gg"g'
      );
    });
    it("throws LexingError on invalid escape sequences", () => {
      expect(() => testStringLexing(`"\\XD"`)).toThrowError(LexingError);
    });
    it("throws LexingError on unterminated strings", () => {
      expect(() => testStringLexing(`"aaaa`)).toThrowError(LexingError);
    });
  });
  describe("lexing of random files found on the internet", () => {
    async function lexFile(path: string) {
      const file = await CodeFile.load(resolve(__dirname, path));
      const lexer = new Lexer(file);
      return lexer.scan();
    }
    it("lexes hull.scad and matches snapshot", async () => {
      const tokens = await lexFile("testdata/hull.scad");
      expect(simplifyTokens(tokens)).toMatchSnapshot();
    });
  });
});
