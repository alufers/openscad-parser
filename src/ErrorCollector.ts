import CodeError from "./errors/CodeError";

export default class ErrorCollector {
  errors: CodeError[] = [];
  reportError<ET extends CodeError>(err: ET): ET {
    this.errors.push(err);
    return err;
  }
  printErrors() {
    this.errors.forEach(e => {
      console.log(e.codeLocation.formatWithContext());
      console.log(Object.getPrototypeOf(e).constructor.name + ": " + e.message);
    });
  }
  hasErrors() {
    return this.errors.length > 0;
  }
}
