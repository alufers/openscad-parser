import TokenType from "./TokenType";

/**
 * A dictionary which maps keyword string values to their TokenType.
 */
const keywords: { [x: string]: TokenType } = {
  module: TokenType.Module,
  function: TokenType.Function,
  if: TokenType.If,
  else: TokenType.Else,
  for: TokenType.For,
  assert: TokenType.Assert,
  each: TokenType.Each,
  echo: TokenType.Echo,
  use: TokenType.Use,
  let: TokenType.Let
};

export default keywords;
