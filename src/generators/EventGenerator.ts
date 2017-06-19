import { GeneratorBase } from './GeneratorBase';
import { IConfig, ILogDecorator } from '../types';
import { IEvent, IParameter, IParameterProperty } from '../UI5DocumentationTypes';
export class EventGenerator extends GeneratorBase {
    currentEvent: IEvent;
    constructor(config: IConfig, addImport: (type: string) => void, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
    }

    public createEventString(event: IEvent, className: string): { method: string, additionalTypes: string[] } {
        this.currentEvent = event;
        let ret = {
            method: "",
            additionalTypes: []
        }
        if (event.description) {
            ret.method += this.createDescription(event.description, event.parameters) + "\n";
        }
        ret.method += event.visibility !== "public" ? event.visibility + " " : "";
        ret.method += event.name + ": (";

        if (event.parameters[0].type === "sap.ui.base.Event") {
            ret.method += event.parameters[0].name + ": " + this.getType(event.parameters[0].type);
            ret.method += "<" + className + ", ";
            if (event.parameters[0].parameterProperties && event.parameters[0].parameterProperties["getParameters"]) {
                const paramInterface = this.getParameterProperties(event.parameters[0].parameterProperties["getParameters"].parameterProperties);
                if(paramInterface === "{ }") {
                    ret.method += "void";
                } else {
                    ret.method += paramInterface;
                }
            } else {
                ret.method += "void";
            }
            ret.method += ">) => void;";
        } else {
            ret.method += event.parameters.map((value, index, array) => {
                if (value.parameterProperties) {
                    return value.name + (value.optional ? "?" : "") + ": " + this.getParameterProperties(value.parameterProperties);
                } else {
                    return value.name + (value.optional ? "?" : "") + ": " + this.getType(value.type);
                }
            }).join(", ");
        }

        return ret;
    }

    private createDescription(description: string, parameters?: IParameter[]): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        if (parameters) {
            for (const param of parameters) {
                ret += `@param {${this.getType(param.type)}} ${param.optional ? "[" : ""}${param.name}${param.optional ? "]" : ""} ${param.description}\n`;
            }
        }

        return this.makeComment(ret);
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Event '" + this.currentEvent.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Event '" + this.currentEvent.name + "'", message);
        }
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
}