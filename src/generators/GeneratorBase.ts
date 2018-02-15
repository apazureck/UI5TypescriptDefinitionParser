import { IConfig, ILogDecorator } from "../types";
import * as Handlebars from "handlebars";
import * as htmltomd from "html-to-markdown";
import * as jsdoc2md from "jsdoc-to-markdown";

htmltomd.use((html: string) => {
  return html.replace(/(<code>|<\/code>)/g, "`");
});
htmltomd.use((html: string) => {
  return html.replace(/(<\/br>|<br\/>)/g, "\n");
});

export abstract class GeneratorBase implements ILogDecorator {
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

  constructor(protected readonly config: IConfig) {}
  protected addTabs(input: string, tabsct: number, separator?: string): string {
    const tabs = Array(tabsct + 1).join(separator || "\t");
    return tabs + input.split("\n").join("\n" + tabs);
  }

  protected styleJsDoc(text: string): string {
    return styleJsDoc(text);
  }

  protected getType(originType: string, context?: "static"): string {
    if (!originType) {
      return "any";
    }
    const unionTypes = originType.split("|");
    let ret: string[] = [];
    for (let type of unionTypes) {
      let isArray = false;
      if (type.match(/\[\]$/)) {
        isArray = true;
        type = type.replace(/\[\]$/, "");
      }

      if (this.config.typeMap.hasOwnProperty(type)) {
        const oldtype = type;

        // Check if class is namespaced
        // if (!type.match(/\./)) {
        type = this.config.typeMap[type];
        ret.push(type);
        this.log("Replaced: Type '" + oldtype + "' => Type '" + type + "'");
        continue;
        // }
      }

      if (this.tsBaseTypes.hasOwnProperty(type)) {
        ret.push(
          isArray ? this.tsBaseTypes[type] + "[]" : this.tsBaseTypes[type]
        );
        continue;
      }

      if (this.config.enums.hasOwnProperty(type)) {
        ret.push(isArray ? type + "[]" : type);
        continue;
      }

      if (this.config.substitutedTypes.hasOwnProperty(type)) {
        ret.push(isArray ? type + "[]" : type);
        continue;
      }

      if (this.config.ambientTypes[type]) {
        ret.push(isArray ? type + "[]" : type);
      } else {
        let alias = this.addImport(type, context);
        if (alias)
          ret.push(isArray ? (alias + "[]") : alias);
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

  protected onAddImport: (module: string, context?: "static") => string;

  protected makeComment(description: string): string {
    return makeComment(description);
  }

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
