import CodeLocation from "../CodeLocation";

export default class ParsingError extends Error {
  constructor(public codeLocation: CodeLocation, message: string) {
    super(message);
  }
}
