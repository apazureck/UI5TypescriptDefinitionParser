import { IConfig, ILogDecorator } from "../../types";
import { IParameter, IParameterProperty } from "../../UI5DocumentationTypes";
import { GeneratorBase } from "../GeneratorBase";
import { ParsedClass } from "./ParsedClass";

export class ParsedParameter extends GeneratorBase {
  private customType = false;
  private hasCustomEventHandler = false;

  public get raw(): IParameter {
    return this.param;
  }
  constructor(
    private param: IParameter,
    private className: string,
    addImport: (type: string) => string,
    config: IConfig,
    private decorated: ILogDecorator,
    private context?: "static"
  ) {
    super(config);
    param.name = this.cleanName(param.name, config);
    this.onAddImport = addImport;
    if (param.type === "sap.ui.base.Event") {
      this.type = this.createEventType(param, className, true);
      this.hasCustomEventHandler = true;
    } else if (param.parameterProperties) {
      this.optional = param.optional ? true : false;
      this.type = this.createCustomParameterType(param.parameterProperties);
      this.customType = true;
    } else {
      this.optional = param.optional ? true : false;
      this.type = this.getType(param.type, this.context);
    }
  }

  getType(originType: string, context?: "static"): string {
    if (this.param.typeAlreadyProcessed) return this.param.type;
    else return super.getType(originType, context);
  }

  private createEventType(
    param: IParameter,
    className: string,
    createDescription: boolean
  ): string {
    let eventtype = this.getType(param.type, this.context);
    eventtype += "<" + "this" + ", ";
    if (
      param.parameterProperties &&
      param.parameterProperties["getParameters"]
    ) {
      const paramInterface = this.createCustomParameterType(
        param.parameterProperties["getParameters"].parameterProperties,
        createDescription
      );
      if (paramInterface === "{ }") {
        eventtype += "void";
      } else {
        eventtype += paramInterface;
      }
    } else {
      eventtype += "void";
    }
    return eventtype + ">";
  }

  private cleanName(name: string, config: IConfig): string {
    if (name === "constructor") return name;
    return config.cleanParamNames[name] || name;
  }

  private createCustomParameterType(
    pps: IParameterProperty[],
    createDescription?: boolean
  ): string {
    let ret = "{ ";

    for (const ppkey in pps) {
      if (pps[ppkey]) {
        const pp = pps[ppkey];
        if (createDescription && pp.description) {
          ret += this.getParamPropertyDescription(
            pp.description,
            pp.defaultValue
          );
        }

        ret += this.cleanName(pp.name, this.config);
        ret += pp.optional ? "?: " : ": ";
        ret += this.getType(pp.type, "static") + ", ";
      }
    }

    return ret + "}";
  }

  private getParamPropertyDescription(
    description: string,
    defaultvalue: any
  ): string {
    return (
      "/*" +
      description
        .split("\n")
        .map((value, index, array) => " * " + value)
        .join("\n") +
      (defaultvalue ? "\n * @default " + defaultvalue.toString() + "\n" : "") +
      " */\n"
    );
  }

  addImports(owner: ParsedClass): void {
    new ParsedParameter(this.raw,
      this.className,
      owner.getAddImport(),
      owner.getConfig(),
      owner)
  }

  get name(): string {
    return this.param.name;
  }

  get description(): string {
    return this.param.description;
  }

  type: string;

  optional: boolean;

  toString(): string {
    return this.name + (this.optional ? "?" : "") + ": " + this.type;
  }

  log(message: string, sourceStack?: string) {
    if (sourceStack) {
      this.decorated.log(
        "Parameter '" + this.name + "' -> " + sourceStack,
        message
      );
    } else {
      this.decorated.log("Parameter '" + this.name + "'", message);
    }
  }
}
