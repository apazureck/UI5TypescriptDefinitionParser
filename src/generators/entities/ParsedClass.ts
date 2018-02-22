import * as events from "events";
import * as Handlebars from "handlebars";
import * as hbex from "../../handlebarsExtensions";
import { GeneratorBase } from "../GeneratorBase";
import { IConfig, IImport, ILogDecorator, OverloadFlags } from "../../types";
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

export class ParsedClass extends GeneratorBase implements IClass {
  getConfig(): IConfig {
    return this.config;
  }
  getAddImport(): (typeOrModule: string, context?: "static") => string {
    return this.onAddImport.bind(this);
  }
  constructor(
    private documentClass: ISymbol,
    private classTemplate: HandlebarsTemplateDelegate<any>,
    config: IConfig,
    private decorated: ILogDecorator,
    private isAmbient?: boolean
  ) {
    super(config);
    if (!logger) {
      logger = new Log("Parser", LogLevel.getValue(this.config.logLevel));
    }
    this.createMissingProperties();
  }
  constructors: ParsedMethod[];
  get basename(): string {
    return this.documentClass.basename;
  }

  get namespace(): string {
    const ret = this.documentClass.name.split(".");
    ret.pop();
    return ret.join(".");
  }

  get module(): string {
    return this.documentClass.module;
  }

  get name(): string {
    return this.documentClass.name;
  }

  public childClasses: ParsedClass[] = [];

  private _baseclass: ParsedClass;
  get baseclass(): ParsedClass {
    return this._baseclass;
  }
  set baseclass(value: ParsedClass) {
    value.childClasses.push(this);
    this._baseclass = value;
  }
  get extendedClass(): string {
    return this.documentClass.extends;
  }
  methods: ParsedMethod[] = [];
  events: ParsedEvent[];
  get description(): string {
    return this.documentClass.description;
  }

  public get Imports(): IImport[] {
    const impa = [];
    for (const importkey in this.imports) {
      if (importkey) {
        impa.push(this.imports[importkey]);
      }
      return impa;
    }
  }
  private imports: { [key: string]: IImport };

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
    this.imports = {};

    if (this.documentClass.extends) {
      this.addImport(this.documentClass.extends);
    }

    // 4. Create Events
    if (this.documentClass.events) {
      this.events = this.documentClass.events.map(
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
    if (this.documentClass.methods) {
      for (const value of this.documentClass.methods) {
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
      if (this.documentClass.constructor) {
        this.documentClass.constructor.name = "constructor";
        this.documentClass.constructor.visibility = "public";
        if (this.documentClass.constructor.parameters[1].name === "mSettings") {
          this.documentClass.constructor.parameters[1].type =
            "I" + this.documentClass.basename + "Settings";
        }

        this.constructors = ParsedMethod.overloadLeadingOptionalParameters(
          this.documentClass.constructor,
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

      if (this.documentClass["ui5-metadata"]) {
        if (this.documentClass["ui5-metadata"].properties) {
          for (const prop of this.documentClass["ui5-metadata"].properties) {
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

  /**
   * Adds an import. Returns the alias name if types should have the same type name.
   *
   * @protected
   * @memberof ParsedClass
   */
  protected onAddImport = (typeName: string, context?: "static"): string => {
    if (!typeName) {
      return;
    }

    if (typeName === "this") {
      if (context === "static") {
        if (this.isAmbient) return this.name;
        else return this.basename;
      } else {
        if (this.isAmbient) return this.name;
        else return "this";
      }
    }

    this.log("Adding import '" + typeName + "'");

    if (typeName === "I" + this.basename + "Settings") {
      return typeName;
    }

    if (this.name === typeName) {
      return context === "static"
        ? this.isAmbient ? this.name : this.basename
        : "this";
    }

    if (this.config.ambientTypes[typeName]) {
      return typeName;
    }

    if (this.isAmbient) {
      return typeName;
    }

    const foundType = this.imports[typeName];
    try {
      // Check if type with same name is already in list
      if (foundType) {
        // Do nothing else if module is already imported
        return (
          foundType.alias ||
          (this.isAmbient ? foundType.name : foundType.basename)
        );
      } else {
        const newmodulartype = this.config.modularTypes[typeName];
        // Check if there is already a type imported with the same name
        for (const impkey in this.imports) {
          const imp = this.imports[impkey];
          if (imp) {
            if (imp.basename === newmodulartype.basename) {
              this.imports[typeName] = {
                basename: newmodulartype.basename,
                name: newmodulartype.name,
                module: newmodulartype.module,
                alias: newmodulartype.name.replace(/\./g, "_")
              };
              return (
                this.imports[typeName].alias || this.imports[typeName].basename
              );
            }
          }
        }
        this.imports[typeName] = {
          basename: newmodulartype.basename,
          name: newmodulartype.name,
          module: newmodulartype.module,
          alias:
            this.basename === newmodulartype.basename
              ? newmodulartype.name.replace(/\./g, "_")
              : undefined
        };
        return this.imports[typeName].alias || this.imports[typeName].basename;
      }
    } catch (error) {
      logger.Error(
        `Could not get type for ${typeName}, returning any type : ${
          error.message
        }`
      );
      return "any";
    }
  };

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
