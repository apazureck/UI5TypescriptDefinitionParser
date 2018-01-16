import { IConfig, ILogDecorator } from '../../types';
import { IEvent, IParameter, IParameterProperty, Visibility } from '../../UI5DocumentationTypes';
import { GeneratorBase } from '../GeneratorBase';
import { ParsedClass } from './ParsedClass';
import { ParsedParameter } from './ParsedParameter';
import * as Handlebars from 'handlebars';

export class ParsedEvent extends GeneratorBase {
    constructor(private wrappedEvent: IEvent, private ownerClass: ParsedClass, config: IConfig, addImport: (type: string) => void, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
        this.createEvent(wrappedEvent, ownerClass.name);
    }

    get name(): string {
        return this.wrappedEvent.name;
    };

    get description(): string {
        return this.wrappedEvent.description;
    }

    get visibility(): Visibility {
        return this.wrappedEvent.visibility;
    }

    parameters: ParsedParameter[];

    private createEvent(event: IEvent, className: string): void {
        // this.createDescription(event.description, event.parameters) + "\n";

        this.parameters = [];
        if(event.parameters[0].type === "sap.ui.base.Event") {
            this.parameters.push(new ParsedParameter(event.parameters[0], this.name, this.onAddImport, this.config, this));
        } else {
            // event.parameters.forEach((value, index, array) => this.parameters.push(new ParsedParameter(value, this.name, this.onAddImport, this.config, this)));
        }
        
    }

    get asString(): string {
        return this.toString();
    }

    toString(): string {
        let ret = this.createDescription(this.wrappedEvent.description, this.parameters) + "\n";
        ret += this.visibility !== "public" ? this.visibility + " " : "";
        ret += this.name + ": (";
        ret += this.parameters.map((value, index, array) => value.toString()).join(", ");
        return ret + ") => void;";
    }

    public get parsedDescription(): string {
        return this.createDescription(this.description, this.parameters);
    }

    private createDescription(description: string, parameters?: ParsedParameter[]): string {
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
            this.decorated.log("Event '" + this.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Event '" + this.name + "'", message);
        }
    }
}