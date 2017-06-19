import { GeneratorBase } from './GeneratorBase';
import { IConfig, ILogDecorator } from '../types';
import { IMethod, IParameter, IParameterProperty, IReturnValue } from '../UI5DocumentationTypes';

export class MethodGenerator extends GeneratorBase {
    private currentMethod: IMethod;
    constructor(config: IConfig, addImport: (type: string) => void, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
    }
    private createDescription(description: string, parameters?: IParameter[], returnValue?: IReturnValue): string {
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


    public createMethodString(method: IMethod): string {
        this.currentMethod = method;
        let ret = {
            method: "",
            additionalTypes: []
        }

        // Overloads
        if (method.parameters && method.parameters.length > 1) {
            return this.createMethodStubs(method).map((value, index, array) => value.description + "\n" + value.method).join("\n");
        } else {
            let stub = this.createMethodStub(method);
            return stub.description + "\n" + stub.method;
        }
    }

    public createMethodStubs(method: IMethod): { method: string; description: string }[] {
        this.currentMethod = method;
        if (method.parameters && method.parameters.length > 1) {
            let overloads: { method: string; description: string }[] = [];
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
                    overloads.push(this.createMethodStub(method));
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
                    overloads.push(this.createMethodStub(method));
                }
            } while (lastMandatoryIndex !== -1 && firstOptionalIndex !== -1 && firstOptionalIndex < lastMandatoryIndex);
            return overloads;
        } else {
            return [this.createMethodStub(method)];
        }
    }

    public createMethodStub(method: IMethod): { method: string; description: string } {
        this.currentMethod = method;
        let ret = {
            description: "",
            method: ""
        }
        if (method.description) {
            ret.description = this.createDescription(method.description, method.parameters, method.returnValue) + "\n";
        }
        if (method.visibility as any === "restricted") {
            method.visibility = "private";
        }
        ret.method += method.visibility !== "public" ? method.visibility + " " : "";
        ret.method += method.static ? "static " : "";
        ret.method += method.name + "(";
        if (method.parameters) {
            ret.method += method.parameters.map((value, index, array) => {
                if (value.parameterProperties) {
                    return value.name + (value.optional ? "?" : "") + ": " + this.getParameterProperties(value.parameterProperties);
                } else {
                    return value.name + (value.optional ? "?" : "") + ": " + this.getType(value.type);
                }
            }).join(", ");
        }
        ret.method += ")";
        if (method.returnValue) {
            ret.method += ": " + this.getType(method.returnValue.type);
        } else {
            ret.method += ": void";
        }
        ret.method += ";";
        return ret;
    }

    private getParameterProperties(pps: IParameterProperty[]): string {
        let ret = "{ ";

        for (const ppkey in pps) {
            if (pps[ppkey]) {
                const pp = pps[ppkey];
                if (pp.description) {
                    ret += this.getParameterDescription(pp.description, pp.defaultValue);
                }

                ret += pp.name;
                ret += pp.optional ? "?: " : ": ";
                ret += this.getType(pp.type) + ", ";
            }
        }

        return ret + "}";
    }

    private getParameterDescription(description: string, defaultvalue: any): string {
        return "/*" + description.split("\n").map((value, index, array) => " * " + value).join("\n") + (defaultvalue ? "\n * @default " + defaultvalue.toString() + "\n" : "") + " */\n";
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Function '" + this.currentMethod.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Function '" + this.currentMethod.name + "'", message);
        }
    }
}