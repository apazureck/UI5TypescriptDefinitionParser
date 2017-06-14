import { ADDRGETNETWORKPARAMS } from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import { Config, Parameter, Symbol } from './types';
import * as types from './types';

interface Dictionary{
    [key: string]: string;
}
export class ClassGenerator {
    private readonly typeSeparators = /[\.\/]/g
    private imports: Dictionary;
    /**
     *
     */
    constructor(private classTemplate: string, private outfolder: string, private config: Config) {
    }

    createClass(sClass: Symbol): string {
        this.imports = {};
        let ct = this.classTemplate.toString();
        // 1. Set Module Name
        ct = ct.replace("classModule", sClass.module);
        // 2. Set Class Name
        ct = ct.replace("className", sClass.basename);
        // 3. Set extends
        if (sClass.extends) {
            ct = ct.replace("/*$$extends$$*/", "extends " + sClass.extends.split(".").pop());
            this.addImport(sClass.extends)
        }
        // 3. Paste description
        ct = ct.replace("/*$$description$$*/", this.createDescription(sClass.description));

        // 4. Create Events
        if (sClass.events) {
            ct = ct.replace("/*$$events$$*/", this.addTabs(sClass.events.map((value, index, array) => {
                return this.createEventString(value).method;
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$events$$*/", "");
        }

        // Replace Imports
        ct = ct.replace("/*$$imports$$*/", this.addTabs(this.importsToString(), 1));
        return ct;
    }

    private addTabs(input: string, tabsct: number, separator?: string): string {
        const tabs = Array(tabsct + 1).join(separator || "\t");
        return tabs + input.split("\n").join("\n" + tabs);
    }

    private createDescription(description: string, parameters?: Parameter[]): string {
        if (!description) {
            return "";
        }

        description = this.styleJsDoc(description);

        let ret = "/**\n";
        for (const line of description.split("\n")) {
            ret += " * " + line + "\n";
        }
        
        if(parameters){
            for (const param of parameters) {
                ret += ` * @param {${this.getType(param.type)}} ${param.optional ? "[" : ""}${param.name}${param.optional ? "]" : ""} ${param.description}\n`
            }
        }
        return ret + " */";
    }

    private createEventString(event: types.Event): { method: string, additionalTypes: string[] } {
        let ret = {
            method: "",
            additionalTypes: []
        }
        if(event.description) {
            ret.method += this.createDescription(event.description, event.parameters) + "\n";
        }
        ret.method += event.visibility !== "public" ? event.visibility + " " : "";
        ret.method += event.name + "(";
        ret.method += event.parameters.map((value, index, array) => {
            return value.name + ": " + this.getType(value.type);
        }).join(",");
        ret.method += ");";
        return ret;
    }

    private styleJsDoc(text: string): string {
        // TODO: Remove xml?
        return text;
    }

    private getType(type: string): string {
        this.addImport(type);
        return type.split(this.typeSeparators).pop();
    }

    /**
     * Adds a new type to the import list
     * 
     * @private
     * @param {string} fullTypeName full Type name as namespace syntax or module syntax
     * 
     * @memberof ClassGenerator
     */
    private addImport(fullTypeName: string): void {
        const typename = fullTypeName.split(this.typeSeparators).pop();
        if(!this.imports[typename]) {
            this.imports[typename] = `import { ${typename} } from '${fullTypeName.replace(/\./g, "/")}'`;
        }
    }

    private importsToString(): string {
        let ret = "";
        for (const i in this.imports) {
            if (this.imports.hasOwnProperty(i)) {
                ret += this.imports[i] + '\n';
            }
        }
        return ret;
    }
}