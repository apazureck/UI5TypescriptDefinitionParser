import { IConfig, ILogDecorator } from "../../types";
import {
  IEvent,
  IParameter,
  IParameterProperty,
  Visibility
} from "../../UI5DocumentationTypes";
import { ParsedBase } from "../ParsedBase";
import { ParsedClass } from "./ParsedClass";
import { ParsedParameter } from "./ParsedParameter";

export class ParsedEvent extends ParsedBase {
  get typings(): string { return undefined };
  constructor(
    private wrappedEvent: IEvent,
    private ownerClass: ParsedClass,
    config: IConfig,
    addImport: (type: string) => string,
    private decorated: ILogDecorator
  ) {
    super(config);
    this.onAddImport = addImport;
    this.createEvent(wrappedEvent, ownerClass.basename);
  }

  get name(): string {
    return this.wrappedEvent.name;
  }

  get description(): string {
    return this.wrappedEvent.description;
  }

  get visibility(): Visibility {
    return this.wrappedEvent.visibility;
  }

  parameters: ParsedParameter[];

  private isBaseEvent: boolean = false;

  private createEvent(event: IEvent, className: string): void {
    // this.createDescription(event.description, event.parameters) + "\n";

    this.parameters = [];
    if (event.parameters.length) {
      if (event.parameters[0].type === "sap.ui.base.Event") {
        this.isBaseEvent = true;
        this.parameters.push(
          new ParsedParameter(
            event.parameters[0],
            className,
            this.onAddImport,
            this.config,
            this,
            "static"
          )
        );
      } else {
        this.parameters = event.parameters.map(
          x =>
            new ParsedParameter(
              x,
              className,
              this.onAddImport,
              this.config,
              this,
            )
        );
        // May be a jquery event?
        this.log("ODD EVENT PARAMETERSET!");
      }
    } else {
      this.log("ODD EVENT PARAMETERSET!");
    }
  }
  get asString(): string {
    return this.toString();
  }

  get callback(): string {
    if (!this.isBaseEvent) {
      let ret = "(";
      ret += this.parameters
        .map((value, index, array) => value.toString())
        .join(", ");
      return ret + ") => void;";
    } else {
      return this.parameters[0].type;
    }
  }

  toString(): string {
    let ret =
      this.createDescription(this.wrappedEvent.description, this.parameters) +
      "\n";
    ret += this.visibility !== "public" ? this.visibility + " " : "";
    ret += this.name + ": (";
    ret += this.parameters
      .map((value, index, array) => value.toString())
      .join(", ");
    return ret + ") => void;";
  }

  public get parsedDescription(): string {
    return this.createDescription(this.description, this.parameters);
  }

  private createDescription(
    description: string,
    parameters?: ParsedParameter[]
  ): string {
    let ret = "";
    if (description) {
      ret = this.styleJsDoc(description) + "\n";
    }

    if (parameters) {
      for (const param of parameters) {
        ret += `@param {${this.getType(param.type, "static")}} ${
          param.optional ? "[" : ""
        }${param.name}${param.optional ? "]" : ""} ${param.description}\n`;
      }
    }

    return this.makeComment(ret);
  }

  log(message: string, sourceStack?: string) {
    if (sourceStack) {
      this.decorated.log(
        "Event '" + this.name + "' -> " + sourceStack,
        message
      );
    } else {
      this.decorated.log("Event '" + this.name + "'", message);
    }
  }
}
