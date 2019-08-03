export class CodePart {}

export enum CodePartSeparation {
  None,
  Left,
  Right,
  Both
}

export class StringCodePart extends CodePart {
  separation = CodePartSeparation.None;
  constructor(public contents: string) {
    super();
  }
  withSeparation(sep: CodePartSeparation) {
    const next = new StringCodePart(this.contents);
    next.separation = sep;
    return next;
  }
}

export class UnconditionalNewLineCodePart extends CodePart {
  constructor() {
    super();
  }
}

export class NoOpCodePart extends CodePart {}

/**
 * A code group represents a line which will always end with an newline. It may be indented.
 */
export class CodeGroup extends CodePart {
  constructor(public children: CodePart[], public indentation: number) {
    super();
  }
}

/**
 * A list of CodeParts (mostly CodeGroups) which does not have its own newline at the end. Used with statement lists and to nest CodeParts etc.
 */
export class CodeList extends CodePart {
  constructor(public children: CodePart[]) {
    super();
  }
}
