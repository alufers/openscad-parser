import CodeLocation from "../CodeLocation";

export default class LexingError extends Error {
  constructor(public codeLocation: CodeLocation, message: string) {
    super(message);
  }
}
