import Lexer from "./Lexer";
import CodeFile from "./CodeFile";
import TokenType from "./TokenType";
import LiteralToken from "./LiteralToken";
import LexingError from "./LexingError";

function lexToTTStream(code: string) {
  const lexer = new Lexer(new CodeFile("<test>", code));
  return lexer.scan().map(token => token.type);
}

function lexTokens(code: string) {
  const lexer = new Lexer(new CodeFile("<test>", code));
  return lexer.scan();
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

  describe("number parsing", () => {
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
});
