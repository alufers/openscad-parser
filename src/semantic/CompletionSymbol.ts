import  CompletionType  from "./CompletionType";

export default class CompletionSymbol {
  constructor(public type: CompletionType, public name: string) { }
}
