import ScadFile from "../ast/ScadFile";
import { Scope } from "..";

export interface WithExportedScopes {
    getExportedScopes(): Scope[];
}

export default interface ScadFileProvider {
  provideScadFile(filePath: string): Promise<WithExportedScopes>;
}
