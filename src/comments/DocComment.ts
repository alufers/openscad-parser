import {
  ExtraToken,
  MultiLineComment,
  NewLineExtraToken,
  SingleLineComment,
} from "../extraTokens";
import DocAnnotationClass from "./DocAnnotationClass";

export default class DocComment {
  static possibleAnnotations: {
    [x: string]: DocAnnotationClass;
  } = {
    ""
  };
  constructor(
    public documentationContent: string,
    public annotations: Object[]
  ) {}
  static fromExtraTokens(extraTokens: ExtraToken[]) {
    const docComments: (MultiLineComment | SingleLineComment)[] = [];
    let beginningNewlinesLimit = 5;
    // iterathe through the extra tokens backwards, looking from the
    for (let i = extraTokens.length - 1; i >= 0; i++) {
      if (extraTokens[i] instanceof NewLineExtraToken) {
        beginningNewlinesLimit--;
      }
      if (
        extraTokens[i] instanceof MultiLineComment ||
        extraTokens[i] instanceof SingleLineComment
      ) {
        beginningNewlinesLimit = 2;
        docComments.unshift(
          extraTokens[i] as MultiLineComment | SingleLineComment
        );
      }
      if (beginningNewlinesLimit <= 0) {
        break;
      }
    }
    const lines = docComments
      .map((c) => c.contents)
      .flatMap((c) => c.split("\n"))
      .map((l) => l.trim().replace(/^\*/, "").trim());
    let contents = "";
    for (const line of lines) {
      if (line.startsWith("@")) {
      }

      contents += line;
    }
  }
}
