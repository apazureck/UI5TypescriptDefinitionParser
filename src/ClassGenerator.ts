import { ADDRGETNETWORKPARAMS } from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import { Config, Method, Parameter, ReturnValue, Symbol } from './types';
import * as types from './types';

interface Dictionary {
    [key: string]: string;
}
export class ClassGenerator {
    private readonly typeSeparators = /[\.\/]/g
    private readonly tsBaseTypes = {
        "any": "any",
        "number": "number",
        "void": "void",
        "string": "string",
        "boolean": "boolean"
    }
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

        // 5. Create methods
        if (sClass.methods) {
            ct = ct.replace("/*$$methods$$*/", this.addTabs(sClass.methods.map((value, index, array) => {
                return this.createMethodString(value).method;
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$methods$$*/", "");
        }

        // Replace Imports
        if (this.imports[sClass.basename]) {
            delete this.imports[sClass.basename];
        }
        ct = ct.replace("/*$$imports$$*/", this.addTabs(this.importsToString(), 1));
        return ct;
    }

    private addTabs(input: string, tabsct: number, separator?: string): string {
        const tabs = Array(tabsct + 1).join(separator || "\t");
        return tabs + input.split("\n").join("\n" + tabs);
    }

    private createDescription(description: string, parameters?: Parameter[], returnValue?: ReturnValue): string {

        let ret = "/**\n";

        if (description) {
            description = this.styleJsDoc(description);
            for (const line of description.split("\n")) {
                ret += " * " + line + "\n";
            }
        }

        if (returnValue) {
            ret += ` * @return {${this.getType(returnValue.type)}} ${returnValue.description}\n`
        }

        if (parameters) {
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
        if (event.description) {
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

    private getType(originType: string): string {
        if (!originType) {
            return "any";
        }
        const unionTypes = originType.split("|");
        let ret: string[] = [];
        for (let type of unionTypes) {
            let isArray = false;
            if (type.match(/\[\]$/)) {
                isArray = true;
                type = type.replace(/\[\]$/, "");
            }

            if (this.config.substitutedTypes.hasOwnProperty(type)) {
                type = this.config.substitutedTypes[type];
            }

            if (this.tsBaseTypes.hasOwnProperty(type)) {
                ret.push(isArray ? this.tsBaseTypes[type] + "[]" : this.tsBaseTypes[type]);
                continue;
            }

            this.addImport(type);
            ret.push(isArray ? type.split(this.typeSeparators).pop() + "[]" : type.split(this.typeSeparators).pop());
        }
        return ret.join("|");
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
        if (!this.imports[typename]) {
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

    private createMethodString(method: Method): { method: string } {
        let ret = {
            method: "",
            additionalTypes: []
        }

        // Overloads
        if (method.parameters && method.parameters.length > 1) {
            let overloads: string[] = [];
            let optionalMap = method.parameters.map((value) => value.optional || false);
            let firstOptionalIndex: number;
            let lastMandatoryIndex: number;
            do {
                // Get first optional and last mandatory parameter
                firstOptionalIndex = optionalMap.indexOf(true);
                lastMandatoryIndex = optionalMap.lastIndexOf(false);
                if (lastMandatoryIndex !== -1 && firstOptionalIndex !== -1 && firstOptionalIndex < lastMandatoryIndex) {
                    // set all parameters left from first mandatory to mandatory
                    for (let i = 0; i < lastMandatoryIndex; i++) {
                        method.parameters[i].optional = false;
                    }
                    // remove optional parameter and create method stub
                    let save = method.parameters.splice(firstOptionalIndex, 1).pop();
                    overloads.push(this.createMethodStub(method).method);
                    method.parameters.splice(firstOptionalIndex, 0, save);

                    // Reset method parameters array
                    for (let i = 0; i < optionalMap.length; i++) {
                        method.parameters[i].optional = optionalMap[i];
                    }

                    // Set removed parameter to mandatory
                    method.parameters[firstOptionalIndex].optional = false;
                    // Reevaluate optional map
                    optionalMap = method.parameters.map((value) => value.optional || false);
                } else {
                    overloads.push(this.createMethodStub(method).method);
                }
            } while (lastMandatoryIndex !== -1 && firstOptionalIndex !== -1 && firstOptionalIndex < lastMandatoryIndex)
            return { method: overloads.join("\n") };
        } else {
            return this.createMethodStub(method);
        }
    }

    private createMethodStub(method: Method): { method: string } {
        let ret = {
            method: ""
        }
        if (method.description) {
            ret.method += this.createDescription(method.description, method.parameters, method.returnValue) + "\n";
        }

        ret.method += method.visibility !== "public" ? method.visibility + " " : "";
        ret.method += method.name + "(";
        if (method.parameters) {
            ret.method += method.parameters.map((value, index, array) => {
                return value.name + (value.optional ? "?" : "") + ": " + this.getType(value.type);
            }).join(",");
        }
        ret.method += ")";
        if (method.returnValue) {
            ret.method += ": " + this.getType(method.returnValue.type);
        }
        ret.method += ";";
        return ret;
    }
}