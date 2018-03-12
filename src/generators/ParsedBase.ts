import { IConfig, ILogDecorator, IType } from "../types";
import * as Handlebars from "handlebars";
import * as htmltomd from "html-to-markdown";
import * as jsdoc2md from "jsdoc-to-markdown";
import { ISymbol } from "../UI5DocumentationTypes";
import { Log, LogLevel } from "../log";

htmltomd.use((html: string) => {
  return html.replace(/(<code>|<\/code>)/g, "`");
});
htmltomd.use((html: string) => {
  return html.replace(/(<\/br>|<br\/>)/g, "\n");
});

export abstract class ParsedBase implements ILogDecorator {
  protected readonly typeSeparators = /[\.\/]/g;
  protected readonly tsBaseTypes = {
    any: "any",
    number: "number",
    void: "void",
    string: "string",
    boolean: "boolean",
    RegExp: "RegExp",
    "{}": "{}",
    TcustomData: "TcustomData"
  };

  protected symbol: ISymbol;
  get basename(): string {
    return this.symbol.basename;
  }

  get export(): string {
    return this.symbol.export;
  }

  protected logger: Log;

  constructor(protected readonly config: IConfig) {
    if (!this.logger) {
      this.logger = new Log(this.constructor.name, LogLevel.getValue(this.config.logLevel));
    }
  }

  public get Imports(): IType[] {
    const impa = [];
    for (const importkey in this.imports) {
      if (importkey) {
        impa.push(this.imports[importkey]);
      }
    }
    return impa;
  }
  protected imports: { [key: string]: IType } = {};

  protected addTabs(input: string, tabsct: number, separator?: string): string {
    const tabs = Array(tabsct + 1).join(separator || "\t");
    return tabs + input.split("\n").join("\n" + tabs);
  }

  protected styleJsDoc(text: string): string {
    return styleJsDoc(text);
  }

  abstract get typings(): string;

  get namespace(): string {
    const ret = this.symbol.name.split(".");
    ret.pop();
    return ret.join(".");
  }

  get module(): string {
    return this.symbol.module;
  }

  get name(): string {
    return this.symbol.name;
  }
  public isAmbient?: boolean;

  protected getType(originType: string, context?: "static", complexOut?: { restype: string, origintype: string }[]): string {
    if (!originType) {
      return "any";
    }
    const unionTypes = originType.split("|");
    let ret: string[] = [];
    for (let type of unionTypes) {
      let isArray = false;

      if (this.config.typeMap.hasOwnProperty(type)) {
        const oldtype = type;
        const entry = this.config.typeMap[type];
        this.log("Replaced: Type '" + oldtype + "' => Type '" + type + "'");
        if (typeof entry !== "string") {
          type = (entry as any).replacement;
          if ((entry as any).return) {
            ret.push(type);
            continue;
          }
        } else {
          type = entry;
        }
      }

      if (type.match(/\[\]$/)) {
        isArray = true;
        type = type.replace(/\[\]$/, "");
      }

      const curtype: { restype?: string, origintype?: string } = {};

      if (complexOut) {
        curtype.origintype = type;
      }

      if (this.tsBaseTypes.hasOwnProperty(type)) {
        ret.push(
          isArray ? this.tsBaseTypes[type] + "[]" : this.tsBaseTypes[type]
        );
        if (complexOut) {
          curtype.restype = this.tsBaseTypes[type];
          complexOut.push(curtype as any);
        }
        continue;
      }

      if (this.config.substitutedTypes.hasOwnProperty(type)) {
        ret.push(isArray ? type + "[]" : type);
        if (complexOut) {
          curtype.restype = type;
          complexOut.push(curtype as any);
        }
        continue;
      }

      if (this.config.ambientTypes[type]) {
        ret.push(isArray ? type + "[]" : type);
        if (complexOut) {
          curtype.restype = type;
          complexOut.push(curtype as any);
        }
      } else {
        let alias = this.addImport(type, context);
        if (alias)
          ret.push(isArray ? (alias + "[]") : alias);
        if (complexOut) {
          curtype.restype = alias;
          complexOut.push(curtype as any);
        }
      }
    }
    return ret.join("|");
  }

  /**
   * Calls the onAddImport Callback
   *
   * @protected
   * @param {string} module Module to import from
   * @param {string} [type] type to import
   *
   * @memberof GeneratorBase
   */
  protected addImport(module: string, context?: "static"): string {
    if (this.onAddImport) {
      return this.onAddImport(module, context);
    }
  }

  protected makeComment(description: string): string {
    return makeComment(description);
  }

  /**
   * Adds an import. Returns the alias name if types should have the same type name.
   *
   * @protected
   * @memberof GeneratorBase
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
      if (this.constructor.name === "ParsedNamespace") {
        return "typeof " + (this.isAmbient ? this.name : this.basename);
      }
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
          (this.isAmbient ? foundType.type.name : foundType.type.basename)
        );
      } else {
        const newmodulartype = this.config.modularTypes[typeName];
        // Check if there is already a type imported with the same name
        for (const impkey in this.imports) {
          const imp = this.imports[impkey];
          if (imp) {
            if (imp.type.basename === newmodulartype.basename) {
              this.imports[typeName] = {
                type: newmodulartype,
                alias: newmodulartype.name.replace(/\./g, "_")
              };
              return (
                this.imports[typeName].alias || this.imports[typeName].type.basename
              );
            }
          }
        }

        // Check if type is in a namespace of local module
        if (this.module === newmodulartype.module) {
          return typeName.split(".").pop();
        }

        // Import new type
        this.imports[typeName] = {
          type: newmodulartype,
          alias:
            this.basename === newmodulartype.basename
              ? newmodulartype.name.replace(/\./g, "_")
              : undefined
        };

        return this.imports[typeName].alias || this.imports[typeName].type.basename;
      }
    } catch (error) {
      this.logger.Error(
        `Could not get type for ${typeName}, returning any type : ${
        error.message
        }`
      );
      return "any";
    }
  };

  abstract log(message: string, sourceStack?: string);
}

export function styleJsDoc(text: string): string {
  if (!text) return "";
  return htmltomd.convert(text);
}

export function makeComment(description: string): string {
  if (!description) {
    return "";
  }
  // Replace any closing comment */
  description = description.replace(/\*\//g, "* /");
  return (
    "* " +
    description
      .split("\n")
      .reduce((aggregate, newLine) => aggregate + "\n * " + newLine)
  );
}
