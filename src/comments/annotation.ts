export class IntrinsicAnnotation {
  static annotationTag = "intrinsic";
  intrinsicType: string;
  constructor(contents: string[]) {
    this.intrinsicType = contents[1] || "";
  }
}

export class IntrinsicRenameAnnotation {
    static annotationTag = "intrinsicRename";
  newName: string;
  constructor(contents: string[]) {
    this.newName = contents[1] || "";
  }
}
