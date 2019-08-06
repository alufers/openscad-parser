import ParsingError from "./ParsingError";
import CodeLocation from "../CodeLocation";
import TokenType from "../TokenType";
import friendlyTokenNames from "../friendlyTokenNames";

/**
 * @category Error
 */
export class UnterminatedUseStatementParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated 'use' statement.`);
  }
}

/**
 * @category Error
 */
export class UnexpectedTokenParsingError extends ParsingError {
  constructor(pos: CodeLocation, tt: TokenType, extraMsg?: string) {
    if (extraMsg) {
      super(pos, `Unexpected token ${friendlyTokenNames[tt]}${extraMsg}`);
    } else {
      super(pos, `Unexpected token ${friendlyTokenNames[tt]}.`);
    }
  }
}

/**
 * @category Error
 */
export class UnexpectedTokenWhenStatementParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, `, expected statement.`);
  }
}

/**
 * @category Error
 */
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

/**
 * @category Error
 */
export class UnexpectedEndOfFileBeforeModuleInstantiationParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unexpected end of file before module instantiation.`);
  }
}

/**
 * @category Error
 */
export class UnterminatedParametersListParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated parameters list.`);
  }
}

/**
 * @category Error
 */
export class UnexpectedTokenInNamedArgumentsListParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, ` in named arguments list.`);
  }
}

/**
 * @category Error
 */
export class UnterminatedForLoopParamsParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated for loop params.`);
  }
}

/**
 * @category Error
 */
export class UnexpectedTokenInForLoopParamsListParsingError extends UnexpectedTokenParsingError {
  constructor(pos: CodeLocation, tt: TokenType) {
    super(pos, tt, ` in for loop params list.`);
  }
}

/**
 * @category Error
 */
export class FailedToMatchPrimaryExpressionParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Failed to match primary expression.`);
  }
}

/**
 * @category Error
 */
export class UnterminatedVectorExpressionParsingError extends ParsingError {
  constructor(pos: CodeLocation) {
    super(pos, `Unterminated vector literal.`);
  }
}

/**
 * @category Error
 */
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
