import { IConfig, ILogDecorator } from "../../types";
import {
  IMethod,
  IParameter,
  IReturnValue,
  Visibility
} from "../../UI5DocumentationTypes";
import { GeneratorBase } from "../GeneratorBase";
import { ParsedClass } from "./ParsedClass";
import { ParsedNamespace } from "./ParsedNamespace";
import { ParsedParameter } from "./ParsedParameter";

export class ParsedMethod extends GeneratorBase {
  parameters: ParsedParameter[] = [];
  stubs: string[];

  get name(): string {
    return this.wrappedMethod.name;
  }

  get description(): string {
    return this.wrappedMethod.description;
  }

  get isStatic(): boolean {
    return this.wrappedMethod.static;
  }

  visibility: Visibility;

  returntype: IReturnValue;

  constructor(
    private wrappedMethod: IMethod,
    onAddImport: (type: string) => void,
    private decorated: ILogDecorator,
    config: IConfig,
    private owner: ParsedClass | ParsedNamespace,
    private suppressReturnValue?: boolean
  ) {
    super(config);
    this.onAddImport = onAddImport;
    this.createMethodStub(suppressReturnValue);
  }

  get parsedDescription(): string {
    return this.createDescription(
      this.description,
      this.parameters,
      this.returntype
    );
  }
  private createDescription(
    description: string,
    parameters?: ParsedParameter[],
    returnValue?: IReturnValue
  ): string {
    let ret = "";
    if (description) {
      ret = this.styleJsDoc(description) + "\n";
    }

    if (returnValue) {
      ret += `@return {${this.getType(returnValue.type)}} ${
        returnValue.description
      }\n`;
    }

    if (parameters) {
      for (const param of parameters) {
        ret += `@param {${this.getType(param.type)}} ${
          param.optional ? "[" : ""
        }${param.name}${param.optional ? "]" : ""} ${param.description}\n`;
      }
    }

    return this.makeComment(ret);
  }

  public static createMethodOverloads(
    method: IMethod,
    onAddImport: (type: string) => void,
    decorated: ILogDecorator,
    config: IConfig,
    owner: ParsedClass | ParsedNamespace,
    suppressReturnValue?: boolean
  ): ParsedMethod[] {
    if (method.parameters && method.parameters.length > 1) {
      let overloads: ParsedMethod[] = [];
      let optionalMap = method.parameters.map(value => value.optional || false);
      let firstOptionalIndex: number;
      let lastMandatoryIndex: number;
      do {
        // Get first optional and last mandatory parameter
        firstOptionalIndex = optionalMap.indexOf(true);
        lastMandatoryIndex = optionalMap.lastIndexOf(false);
        if (
          lastMandatoryIndex !== -1 &&
          firstOptionalIndex !== -1 &&
          firstOptionalIndex < lastMandatoryIndex
        ) {
          // set all parameters left from first mandatory to mandatory
          for (let i = 0; i < lastMandatoryIndex; i++) {
            method.parameters[i].optional = false;
          }
          // remove optional parameter and create method stub
          let save = method.parameters.splice(firstOptionalIndex, 1).pop();
          overloads.push(
            new ParsedMethod(
              method,
              onAddImport,
              decorated,
              config,
              owner,
              suppressReturnValue
            )
          );
          method.parameters.splice(firstOptionalIndex, 0, save);

          // Reset method parameters array
          for (let i = 0; i < optionalMap.length; i++) {
            method.parameters[i].optional = optionalMap[i];
          }

          // Set removed parameter to mandatory
          method.parameters[firstOptionalIndex].optional = false;
          // Reevaluate optional map
          optionalMap = method.parameters.map(value => value.optional || false);
        } else {
          overloads.push(
            new ParsedMethod(
              method,
              onAddImport,
              decorated,
              config,
              owner,
              suppressReturnValue
            )
          );
        }
      } while (
        lastMandatoryIndex !== -1 &&
        firstOptionalIndex !== -1 &&
        firstOptionalIndex < lastMandatoryIndex
      );
      return overloads;
    } else {
      return [new ParsedMethod(method, onAddImport, decorated, config, owner)];
    }
  }

  public IsGeneric: boolean = false;

  public GenericParameters: string[] = [];

  private createMethodStub(suppressReturnValue?: boolean): void {
    try {
      // If method name starts with attach it is an event
      if (this.owner instanceof ParsedClass && this.name.startsWith("attach")) {
        const eventname = /attach(.*)/.exec(this.name)[1].toLocaleLowerCase();
        const objParam = this.wrappedMethod.parameters.find(
          x => x.name === "oData"
        );
        if (objParam) {
          this.IsGeneric = true;
          objParam.type = "TcustomData";
          this.GenericParameters.push(objParam.type);
          this.parameters.push(
            new ParsedParameter(
              objParam,
              this.owner.name,
              undefined,
              this.config,
              this
            )
          );
        }
        const func = this.wrappedMethod.parameters.find(
          x => x.name === "fnFunction"
        );

        const context = this.wrappedMethod.parameters.find(
          x => x.name === "oListener"
        );
        if (context) {
          context.type = "Tcontext";
          this.IsGeneric = true;
          this.GenericParameters.push(context.type);
          this.parameters.push(
            new ParsedParameter(
              context,
              this.owner.name,
              undefined,
              this.config,
              this
            )
          );
        }

        if (func) {
          const event = (this.owner as ParsedClass).events.find(
            x => x.name.toLowerCase() === eventname
          );
          if (event) {
            try {
              func.type =
                "(" + (context ? "this: Tcontext, " : "")
                + "oEvent: " + event.parameters[0].type +
                (objParam ? ", oCustomData?: TcustomData) => void" : ") => void");
            } catch (error) {
              let i = 0;
            }
          }
          this.parameters.push(
            new ParsedParameter(
              func,
              this.owner.name,
              undefined,
              this.config,
              this
            )
          );

          this.returntype = {
            type: "this",
            description: ""
          };
        }
      } else {
        suppressReturnValue = suppressReturnValue || false;

        if ((this.wrappedMethod.visibility as any) === "restricted") {
          this.visibility = "private";
        } else {
          this.visibility = this.wrappedMethod.visibility;
        }

        if (this.wrappedMethod.parameters) {
          this.parameters = this.wrappedMethod.parameters.map<ParsedParameter>(
            (value, index, array) =>
              new ParsedParameter(
                value,
                (this.owner as ParsedClass).name,
                this.onAddImport,
                this.config,
                this
              )
          );
        }

        if (suppressReturnValue) {
        } else if (this.wrappedMethod.returnValue) {
          this.returntype = {
            type: this.getType(this.wrappedMethod.returnValue.type),
            description: this.wrappedMethod.returnValue.description
          };
        } else {
          this.returntype = { type: "void", description: "" };
        }
      }
    } catch (error) {
      throw error;
    }
  }

  toString(suppressDescription?: boolean): string {
    suppressDescription = suppressDescription || false;
    this.suppressReturnValue = this.suppressReturnValue || false;
    let ret: string = "";

    if (this.description && !suppressDescription) {
      ret +=
        this.createDescription(
          this.description,
          this.parameters,
          this.returntype
        ) + "\n";
    }

    ret += this.visibility !== "public" ? this.visibility + " " : "";
    ret += this.isStatic ? "static " : "";
    ret += this.name + "(";
    ret += this.parameters
      .map<string>((value, index, array) => value.toString())
      .join(", ");

    ret += ")";
    if (!this.suppressReturnValue) {
      ret += ": " + this.getType(this.returntype.type);
    }
    ret += ";";
    return ret;
  }

  private getParameterDescription(
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

  log(message: string, sourceStack?: string) {
    if (sourceStack) {
      this.decorated.log(
        "Function '" + this.name + "' -> " + sourceStack,
        message
      );
    } else {
      this.decorated.log("Function '" + this.name + "'", message);
    }
  }

  public IsOverload(method: ParsedMethod) {
    if (this.name !== method.name) return false;

    if (this.parameters.length === method.parameters.length) return false;

    return true;
  }
}
