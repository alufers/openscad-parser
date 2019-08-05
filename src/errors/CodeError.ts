import CodeLocation from "../CodeLocation";

export default abstract class CodeError extends Error {
  constructor(public codeLocation: CodeLocation, message: string) {
    super(message);
  }
}
