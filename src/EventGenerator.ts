import { Config, Parameter } from './types';
import { GeneratorBase } from './GeneratorBase';
import * as types from './types';
export class EventGenerator extends GeneratorBase {
    constructor(config: Config, addImport: (type: string) => void) {
        super(config);
        this.onAddImport = addImport;
    }

    public createEventString(event: types.Event): { method: string, additionalTypes: string[] } {
        let ret = {
            method: "",
            additionalTypes: []
        }
        if (event.description) {
            ret.method += this.createDescription(event.description, event.parameters) + "\n";
        }
        ret.method += event.visibility !== "public" ? event.visibility + " " : "";
        ret.method += event.name + ": (";
        ret.method += event.parameters.map((value, index, array) => {
            return value.name + ": " + this.getType(value.type);
        }).join(",");
        ret.method += ") => void;";
        return ret;
    }

    private createDescription(description: string, parameters?: Parameter[]): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        if (parameters) {
            for (const param of parameters) {
                ret += `@param {${this.getType(param.type)}} ${param.optional ? "[" : ""}${param.name}${param.optional ? "]" : ""} ${param.description}\n`
            }
        }

        return this.makeComment(ret);
    }
}