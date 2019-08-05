import ParsingError from "./ParsingError";
import CodeLocation from "../CodeLocation";
import TokenType from "../TokenType";
import friendlyTokenNames from "../friendlyTokenNames";

export class UnterminatedUseStatementParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated 'use' statement.`);
  }
}

export class UnexpectedTokenParsingError extends ParsingError {
  constructor(pos: CodeLocation, tt: TokenType, extraMsg?: string) {
    if (extraMsg) {
      super(pos, `Unexpected token ${friendlyTokenNames[tt]}${extraMsg}`);
    } else {
      super(pos, `Unexpected token ${friendlyTokenNames[tt]}.`);
    }
  }
}

export class UnexpectedTokenWhenStatementParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, `, expected statement.`);
  }
}

export class UnexpectedTokenAfterIdentifierInStatementParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(
      pos,
      tt,
      `, expected ${friendlyTokenNames[TokenType.LeftParen]} or ${
        friendlyTokenNames[TokenType.Equal]
      } after identifier in statement.`
    );
  }
}

export class UnexpectedEndOfFileBeforeModuleInstantiationParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unexpected end of file before module instantiation.`);
  }
}

export class UnterminatedParametersListParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated parameters list.`);
  }
}

export class UnexpectedTokenInNamedArgumentsListParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, ` in named arguments list.`);
  }
}

export class UnterminatedForLoopParamsParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated for loop params.`);
  }
}

export class UnexpectedTokenInForLoopParamsListParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, ` in for loop params list.`);
  }
}

export class FailedToMatchPrimaryExpressionParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Failed to match primary expression.`);
  }
}

export class UnterminatedVectorExpressionParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated vector literal.`);
  }
}

export class ConsumptionParsingError extends UnexpectedTokenParsingError {
  constructor(
    pos: CodeLocation,
    real: TokenType,
    expected: TokenType,
    where: string
  ) {
    super(pos, real, `, expected ${friendlyTokenNames[expected]} ${where}.`);
  }
}
