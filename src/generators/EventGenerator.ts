import { GeneratorBase } from './GeneratorBase';
import { IConfig, ILogDecorator } from '../types';
import { IEvent, IParameter, IParameterProperty } from '../UI5DocumentationTypes';
export class EventGenerator extends GeneratorBase {
    currentEvent: IEvent;
    constructor(config: IConfig, addImport: (type: string) => void, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
    }

    public createEventString(event: IEvent): { method: string, additionalTypes: string[] } {
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
        ret.method += event.parameters.map((value, index, array) => {
            return value.name + ": " + this.getType(value.type);
        }).join(",");
        ret.method += ") => void;";
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
        if(sourceStack) {
            this.decorated.log("Event '" + this.currentEvent.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Event '" + this.currentEvent.name + "'", message);
        }
    }
}