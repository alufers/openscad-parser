export class CodePart {
  parent: CodePart;
}

export enum CodePartSeparation {
  None,
  Left,
  Right,
  Both
}

export class StringCodePart extends CodePart {
  separation = CodePartSeparation.None;
  constructor(public parent: CodePart, public contents: string) {
    super();
  }
  withSeparation(sep: CodePartSeparation) {
    const next = new StringCodePart(this.parent, this.contents);
    next.separation = sep;
    return next;
  }
}

export class UnconditionalNewLineCodePart extends CodePart {
  constructor(public parent: CodePart) {
    super();
  }
}

export class CollapsibleNewLineCodePart extends CodePart {
  constructor(public parent: CodePart) {
    super();
  }
}

export class NoOpCodePart extends CodePart {
  constructor(public parent: CodePart) {
    super();
  }
}

export class GroupCodePart extends CodePart {
  constructor(public parent: CodePart, public children: CodePart[]) {
    super();
  }
}

export class IndentedCodePart extends CodePart {
  constructor(
    public parent: CodePart,
    public child: CodePart,
    public indentation: number
  ) {
    super();
  }
}
