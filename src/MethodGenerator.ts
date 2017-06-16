import { GeneratorBase } from './GeneratorBase';
import { Config, Method, Parameter, ReturnValue } from './types';
export class MethodGenerator extends GeneratorBase {

    constructor(config: Config, addImport: (type: string) => void) {
        super(config);
        this.onAddImport = addImport;
    }
    private createDescription(description: string, parameters?: Parameter[], returnValue?: ReturnValue): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        if (returnValue) {
            ret += `@return {${this.getType(returnValue.type)}} ${returnValue.description}\n`
        }

        if (parameters) {
            for (const param of parameters) {
                ret += `@param {${this.getType(param.type)}} ${param.optional ? "[" : ""}${param.name}${param.optional ? "]" : ""} ${param.description}\n`
            }
        }

        return this.makeComment(ret);
    }

    public createMethodString(method: Method): { method: string } {
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
            }).join(", ");
        }
        ret.method += ")";
        if (method.returnValue) {
            ret.method += ": " + this.getType(method.returnValue.type);
        }
        ret.method += ";";
        return ret;
    }
}