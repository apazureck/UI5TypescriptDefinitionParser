import * as events from "events";
import * as Handlebars from "handlebars";
import * as hbex from "../../handlebarsExtensions";
import { ParsedBase } from "../ParsedBase";
import { IConfig, IType, ILogDecorator, OverloadFlags } from "../../types";
import { IParameter, IProperty, ISymbol } from "../../UI5DocumentationTypes";
import { Log, LogLevel } from "../../log";
import { ParsedEvent } from "./ParsedEvent";
import { ParsedMethod } from "./ParsedMethod";
import { ParsedParameter } from "./ParsedParameter";

let logger: Log;

interface IClass {
  constructors: ParsedMethod[];
  childClasses: ParsedClass[];
  methods: ParsedMethod[];
  events: ParsedEvent[];
  parsedDescription: string;
}

export class ParsedClass extends ParsedBase implements IClass {
  get typings(): string {
    try {
      return this.classTemplate(this);
  } catch (error) {
      this.log("Handlebars error: " + error.message + "\n" + error.stack);
      throw error;
  }
  }
  getConfig(): IConfig {
    return this.config;
  }
  getAddImport(): (typeOrModule: string, context?: "static") => string {
    return this.onAddImport.bind(this);
  }
  constructor(
    symbol: ISymbol,
    private classTemplate: HandlebarsTemplateDelegate<any>,
    config: IConfig,
    private decorated: ILogDecorator,
    isAmbient?: boolean
  ) {
    super(config);
    this.symbol = symbol;
    this.isAmbient = isAmbient;
    if (!logger) {
      logger = new Log("Parser", LogLevel.getValue(this.config.logLevel));
    }
    this.createMissingProperties();
  }
  constructors: ParsedMethod[];

  public childClasses: ParsedClass[] = [];

  private _baseclass: ParsedClass;
  get baseclass(): ParsedClass {
    return this._baseclass;
  }
  set baseclass(value: ParsedClass) {
    value.childClasses.push(this);
    this._baseclass = value;
  }
  get extends(): string {
    return this.symbol.extends;
  }
  methods: ParsedMethod[] = [];
  events: ParsedEvent[];
  get description(): string {
    return this.symbol.description;
  }

  toString(): string {
    // this.parsedDescription = this.createDescription(this.description);
    return this.classTemplate(this);
  }

  log(message: string, sourceStack?: string): void {
    if (sourceStack) {
      this.decorated.log(
        "Class '" + this.basename + "' -> " + sourceStack,
        message
      );
    } else {
      this.decorated.log("Class '" + this.basename + "'", message);
    }
  }

  private createMissingProperties(): void {
    this.log("Creating properties, events and methods");

    if (this.symbol.extends) {
      this.addImport(this.symbol.extends);
    }

    // 4. Create Events
    if (this.symbol.events) {
      this.events = this.symbol.events.map(
        (value, index, array) =>
          new ParsedEvent(
            value,
            this,
            this.config,
            this.onAddImport.bind(this),
            this
          )
      );
    } else {
      this.events = [];
    }

    // 5. Create methods
    if (this.symbol.methods) {
      for (const value of this.symbol.methods) {
        this.methods = this.methods.concat(
          ParsedMethod.overloadLeadingOptionalParameters(
            value,
            this.onAddImport.bind(this),
            this,
            this.config,
            this
          )
        );
      }
    } else {
      this.methods = [];
    }

    // 6. Create Constructor
    try {
      if (this.symbol.constructor) {
        this.symbol.constructor.name = "constructor";
        this.symbol.constructor.visibility = "public";

        this.constructors = ParsedMethod.overloadLeadingOptionalParameters(
          this.symbol.constructor,
          this.onAddImport.bind(this),
          this,
          this.config,
          this,
          true,
          "static"
        );
      }
    } catch (error) {
      // Caught, as always a constructor is given.
      this.constructors = [];
    }

    // 7. Create Extension interface
    try {
      this.log("Creating settings interface");

      let props: IProperty[] = [];

      if (this.symbol["ui5-metadata"]) {
        if (this.symbol["ui5-metadata"].properties) {
          for (const prop of this.symbol["ui5-metadata"].properties) {
            prop.type = this.getType(prop.type);
            props.push(prop);
          }
          this.settingsInterfaceProperties = props;
        }
      }
    } catch (error) {
      this.settingsInterfaceProperties = [];
    }
  }

  private settingsInterfaceProperties: IProperty[] = [];

  private createDescription(description: string): string {
    this.log("Creating description");
    if (!description) {
      return "";
    }
    let ret = "/**\n";

    if (description) {
      description = this.styleJsDoc(description);
      description = this.makeComment(description);
    }

    return description;
  }

  parsedDescription: string;

  public pushOverloads(): void {
    this.log("Pushing Overloads");
    for (const c of this.childClasses) {
      c.createOverloads();
      c.pushOverloads();
    }
  }

  public createOverloads(): void {
    this.log("Creating overloads for all base classes, if necessary.");
    const thismethods = this.methods;
    getOverloadFromBaseClass(this, this.baseclass);
    this.methods = this.methods.sort((a, b) => a.name.localeCompare(b.name));
  }

  public pushMethodFromBaseClass(baseMethod: ParsedMethod): void {
    for (const param of baseMethod.parameters) {
      param.addImports(this);
    }
    this.methods.push(baseMethod);
  }
}

function getOverloadFromBaseClass(
  childclass: ParsedClass,
  baseclass: ParsedClass
): void {
  if (!baseclass) {
    return;
  }
  getOverloadFromBaseClass(childclass, baseclass.baseclass);
  for (const basemethod of baseclass.methods) {
    const possibleOverloads = childclass.methods.filter(
      (value, index, array) => value.name === basemethod.name
    );
    if (possibleOverloads.length > 0) {
      const match = possibleOverloads.find(x => !x.IsOverload(basemethod));
      if (!match) {
        const overload = possibleOverloads.find(
          x => x.IsOverload(basemethod) !== OverloadFlags.None
        );
        const original = overload.overload(basemethod);
        if (original) {
          childclass.pushMethodFromBaseClass(original);
        }
        // TODO: Find best method to overload, maybe with better return parameter of isoverload
      }
    }
  }
}
