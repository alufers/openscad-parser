import CodeFile from "./CodeFile";

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
}
