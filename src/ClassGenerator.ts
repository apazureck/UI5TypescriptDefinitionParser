import * as fs from 'fs';
import * as path from 'path';
import { Symbol } from './types';
import * as types from './types';
export class ClassGenerator {
    /**
     *
     */
    constructor(private classTemplate: string, private outfolder: string) {
    }

    createClass(sClass: Symbol): string {
        let ct = this.classTemplate.toString();
        // Imports will stored here until the end
        let imports = "";
        // 1. Set Module Name
        ct = ct.replace("classModule", sClass.module);
        // 2. Set Class Name
        ct = ct.replace("className", sClass.basename);
        // 3. Set extends
        if (sClass.extends) {
            const extendedClassName = sClass.extends.split(".").pop();
            ct = ct.replace("/*$$extends$$*/", "extends " + extendedClassName);
            imports += `import { ${extendedClassName} } from '${sClass.extends.replace(/\./g, "/")}'`;
        }
        // 3. Paste description
        ct = ct.replace("/*$$description$$*/", this.createClassDescription(sClass.description));

        // Replace Imports
        ct = ct.replace("/*$$imports$$*/", imports);
        return ct;
    }

    private createClassDescription(description: string): string {
        if (!description) {
            return "";
        }

        description = this.styleJsDoc(description);

        let ret = "/**\n";
        for (const line of description.split("\n")) {
            ret += " * " + line + "\n";
        }
        return ret + " */";
    }

    private createEventString(event: types.Event): { method: string, additionalTypes: string[] } {
        let ret = {
            method: "",
            additionalTypes: []
        }
        ret.method += event.visibility !== "public" ? event.visibility + " " : "";
        ret.method += name + "(";
        return ret;
    }

    private styleJsDoc(text: string): string {
        // TODO: Remove xml?
        return text;
    }
}