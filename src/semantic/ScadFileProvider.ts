import ScadFile from "../ast/ScadFile";
import { Scope } from "..";

export interface WithExportedScopes {
    getExportedScopes(): Scope[];
}

export default interface ScadFileProvider<T extends WithExportedScopes> {
  provideScadFile(filePath: string): Promise<T>;
}
