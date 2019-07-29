import ASTNode from "./ASTNode";
import TokenType from "../TokenType";
import CodeLocation from "../CodeLocation";
import AssignmentNode from "./AssignmentNode";

export abstract class Expression extends ASTNode {}

/**
 * Represents an unary expression (!right, -right)
 */
export class UnaryOpExpr extends Expression {
  /**
   * The operation of this unary expression.
   */
  operation: TokenType;

  /**
   * The expression on which the operation is performed.
   */
  right: Expression;

  constructor(pos: CodeLocation, op: TokenType, right: Expression) {
    super(pos);
    this.operation = op;
    this.right = right;
  }
}

/**
 * Represents a binary expression (LogicalAnd, LogicalOr, Multiply, Divide, Modulo, Plus, Minus, Less, LessEqual, Greater, GreaterEqual, Equal, NotEqual).
 */
export class BinaryOpExpr extends Expression {
  /**
   * THe left side of the operation.
   */
  left: Expression;

  /**
   * The type of the operation performed.
   */
  operation: TokenType;

  /**
   * The right side of the operation
   */
  right: Expression;

  constructor(
    pos: CodeLocation,
    left: Expression,
    operation: TokenType,
    right: Expression
  ) {
    super(pos);
    this.left = left;
    this.operation = operation;
    this.right = right;
  }
}

/**
 * Represents a ternary expression (cond ? ifexpr : elsexpr)
 */
export class TernaryExpr extends Expression {
  cond: Expression;
  ifExpr: Expression;
  elseExpr: Expression;
  constructor(
    pos: CodeLocation,
    cond: Expression,
    ifExpr: Expression,
    elseExpr: Expression
  ) {
    super(pos);
    this.cond = cond;
    this.ifExpr = ifExpr;
    this.elseExpr = elseExpr;
  }
}

/**
 * Represents a lookup operation on an array (indexing). Example: arr[5]
 */
export class ArrayLookupExpr extends Expression {
  /**
   * The array being indexed.
   */
  array: Expression;

  /**
   * The index which is being looked up.
   */
  index: Expression;

  constructor(pos: CodeLocation, array: Expression, index: Expression) {
    super(pos);
    this.array = array;
    this.index = index;
  }
}

/**
 * A literal expression (just a simple number, string or a boolean)
 */
export class LiteralExpr<TValue> extends Expression {
  value: TValue;

  constructor(pos: CodeLocation, value: TValue) {
    super(pos);
    this.value = value;
  }
}

/**
 * A range epxression. Example: [0: 1 :20]
 */
export class RangeExpr extends Expression {
  begin: Expression;
  step: Expression;
  end: Expression;
  constructor(
    pos: CodeLocation,
    begin: Expression,
    step: Expression,
    end: Expression
  ) {
    super(pos);
    this.begin = begin;
    this.step = step;
    this.end = end;
  }
}

/**
 * A vector literal expression. Example: [1, 2, 3, 4]
 */
export class VectorExpr extends Expression {
  children: Expression[];
  constructor(pos: CodeLocation, children: Expression[]) {
    super(pos);
    this.children = children;
  }
}

/**
 * A lookup expression, it references a variable, module or function by name.
 */
export class Lookup extends Expression {
  name: string;

  constructor(pos: CodeLocation, name: string) {
    super(pos);
    this.name = name;
  }
}

/**
 * A member lookup expression, (abc.ddd)
 */
export class MemberLookup extends Expression {
  expr: Expression;
  member: string;

  constructor(pos: CodeLocation, expr: Expression, member: string) {
    super(pos);
    this.expr = expr;
    this.member = member;
  }
}

/**
 * A function call expression. Example: sin(10)
 */
export class FunctionCallExpr extends Expression {
  /**
   * The name of the function to call
   */
  name: string;

  /**
   * The named arguments of the function call
   */
  args: AssignmentNode[];
  constructor(pos: CodeLocation, name: string, args: AssignmentNode[]) {
    super(pos);
    this.name = name;
    this.args = args;
  }
}


export abstract class ListComprehension extends Expression {}

export class LcIfExpr extends ListComprehension {
  cond: Expression;
  ifExpr: Expression;
  elseExpr: Expression;
  constructor(
    pos: CodeLocation,
    cond: Expression,
    ifExpr: Expression,
    elseExpr: Expression
  ) {
    super(pos);
    this.cond = cond;
    this.ifExpr = ifExpr;
    this.elseExpr = elseExpr;
  }
}

export class LcEachExpr extends Expression {
  /**
   * The expression where the declared variables will be accessible.
   */
  expr: Expression;

  constructor(pos: CodeLocation, expr: Expression) {
    super(pos);

    this.expr = expr;
  }
}

export class LcForExpr extends Expression {
  /**
   * The variable names in the for expression
   */
  args: AssignmentNode[];

  /**
   * The expression which will be looped.
   */
  expr: Expression;

  constructor(pos: CodeLocation, args: AssignmentNode[], expr: Expression) {
    super(pos);
    this.args = args;
    this.expr = expr;
  }
}

export class LcForCExpr extends Expression {
  /**
   * The variable names in the for expression
   */
  args: AssignmentNode[];

  incrArgs: AssignmentNode[];

  cond: Expression;
  /**
   * The expression which will be looped.
   */
  expr: Expression;

  constructor(
    pos: CodeLocation,
    args: AssignmentNode[],
    incrArgs: AssignmentNode[],
    cond: Expression,
    expr: Expression
  ) {
    super(pos);
    this.args = args;
    this.incrArgs = incrArgs;
    this.cond = cond;
    this.expr = expr;
  }
}

export class LcLetExpr extends Expression {
  /**
   * The variable names in the let expression
   */
  args: AssignmentNode[];

  /**
   * The expression where the declared variables will be accessible.
   */
  expr: Expression;

  constructor(pos: CodeLocation, args: AssignmentNode[], expr: Expression) {
    super(pos);
    this.args = args;
    this.expr = expr;
  }
}

/**
 * An expression enclosed in parenthesis.
 */
export class GroupingExpr extends Expression {
  inner: Expression;
  constructor(pos: CodeLocation, inner: Expression) {
    super(pos);
    this.inner = inner;
  }
}
