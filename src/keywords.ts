import TokenType from "./TokenType";
import { Token } from ".";

/**
 * A dictionary which maps keyword string values to their TokenType.
 */
const keywords: { [x: string]: TokenType } = {
  true: TokenType.True,
  false: TokenType.False,
  undef: TokenType.Undef,
  module: TokenType.Module,
  function: TokenType.Function,
  if: TokenType.If,
  else: TokenType.Else,
  for: TokenType.For,
  assert: TokenType.Assert,
  each: TokenType.Each,
  echo: TokenType.Echo,
  use: TokenType.Use,
  let: TokenType.Let,
  include: TokenType.Include,
};

export default keywords;
