import { IConfig, ILogDecorator } from '../../../out/types';
import { IParameter, IParameterProperty } from '../../UI5DocumentationTypes';
import { GeneratorBase } from '../GeneratorBase';

export class ParsedParameter extends GeneratorBase {
    private customType = false;
    private hasCustomEventHandler = false;
    constructor(private param: IParameter, className: string, addImport: (type: string) => void, config: IConfig, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
        if (param.type === "sap.ui.base.Event") {
            let eventtype = this.getType(param.type);
            eventtype += "<" + className + ", ";
            if (param.parameterProperties && param.parameterProperties["getParameters"]) {
                const paramInterface = this.createCustomParameterType(param.parameterProperties["getParameters"].parameterProperties, true);
                if (paramInterface === "{ }") {
                    eventtype += "void";
                } else {
                    eventtype += paramInterface;
                }
            } else {
                eventtype += "void";
            }
            eventtype += ">) => void";
            this.hasCustomEventHandler = true;
        } else if (param.parameterProperties) {
            this.optional = param.optional ? true : false;
            this.type = this.createCustomParameterType(param.parameterProperties);
            this.customType = true;
        } else {
            this.optional = param.optional ? true : false;
            this.type = this.getType(param.type);
        }
    }

    private createCustomParameterType(pps: IParameterProperty[], createDescription?: boolean): string {
        let ret = "{ ";

        for (const ppkey in pps) {
            if (pps[ppkey]) {
                const pp = pps[ppkey];
                if (createDescription && pp.description) {
                    ret += this.getParamPropertyDescription(pp.description, pp.defaultValue);
                }

                ret += pp.name;
                ret += pp.optional ? "?: " : ": ";
                ret += this.getType(pp.type) + ", ";
            }
        }

        return ret + "}";
    }

    private getParamPropertyDescription(description: string, defaultvalue: any): string {
        return "/*" + description.split("\n").map((value, index, array) => " * " + value).join("\n") + (defaultvalue ? "\n * @default " + defaultvalue.toString() + "\n" : "") + " */\n";
    }

    get name(): string {
        return this.param.name;
    }

    get description(): string {
        return this.param.description;
    }

    readonly type: string;

    optional: boolean;

    toString(): string {
        return this.name + (this.optional ? "?" : "") + ": " + this.type;
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Parameter '" + this.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Parameter '" + this.name + "'", message);
        }
    }
}