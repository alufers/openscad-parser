import CodeLocation from "./CodeLocation";

export default class Range {
  constructor(public start: CodeLocation, public end: CodeLocation) {}
}
