/**
 * Adds special flags for built in constructs in the language.
 * Only for use in the prelude.
 * Used to mark the `for` and `intersection_for` modules as loops, and their arguments are in fact variable declarations.
 */
export class IntrinsicAnnotation {
  static annotationTag = "intrinsic";
  intrinsicType: string;
  constructor(contents: string[]) {
    this.intrinsicType = contents[0] || "";
  }
}

/**
 * Renames this symbol to a diffrent name (which for example is a reserved keyword).
 * Used by the prelude to define `for` and `intersection_for` so that they can be resolved without errors.
 */
export class IntrinsicRenameAnnotation {
    static annotationTag = "intrinsicRename";
  newName: string;
  constructor(contents: string[]) {
    this.newName = contents[0] || "";
  }
}
