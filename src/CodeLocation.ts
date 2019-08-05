import CodeFile from "./CodeFile";

/**
 * THe number of lines to display when printing the context of the error.
 */
const CONTEXT_LINES_BEFORE = 5;

export default class CodeLocation {
  constructor(
    file: CodeFile = null,
    char: number = 0,
    line: number = 0,
    col: number = 0
  ) {
    this.file = file;
    this.char = char;
    this.line = line;
    this.col = col;
  }

  /**
   * THe file to which this location points.
   */
  file: CodeFile;

  /**
   * The character offset in the fil;e contents.
   */
  char = 0;

  /**
   * The line number of this location. Zero-indexed.
   */
  line = 0;

  /**
   * The column number of this location. Zero-indexed.
   */
  col = 0;

  toString(): string {
    return `file '${this.file.filename}' line ${this.line + 1} column ${this
      .col + 1}'`;
  }

  /**
   * Copies this object.
   */
  copy() {
    return new CodeLocation(this.file, this.char, this.line, this.col);
  }

  formatWithContext() {
    let outStr = `${this.file.path}:${this.line + 1}:${this.col}:\n`;
    const sourceLines = this.file.code.split("\n");
    const contextStartIndex = Math.max(0, this.line - CONTEXT_LINES_BEFORE);

    const linesToDisplay = sourceLines.slice(contextStartIndex, this.line + 1);
    outStr += linesToDisplay.reduce((prev, line, index) => {
      return (
        prev +
        ` ${(contextStartIndex + index + 1).toString().padStart(3)}| ${line}\n`
      );
    }, "");
    outStr += "\n";
    return outStr;
  }
}
