import * as Handlebars from "handlebars";
import {
  styleJsDoc,
  makeComment,
  GeneratorBase
} from "./generators/GeneratorBase";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { IImport } from "./types";
import { ISymbol } from "./UI5DocumentationTypes";
export function registerHelpers(Handlebars: any) {
  Handlebars.registerHelper("ifCond", function(
    v1: string,
    operator: string,
    v2: string,
    options
  ) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case "!=":
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case "!==":
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case "<":
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case "<=":
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case ">":
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case ">=":
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case "&&":
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });

  Handlebars.registerHelper("ifHasNamespace", function(v1: string, options) {
    return v1.split(".").length > 1 ? options.fn(this) : options.inverse(this);
  });

  let importedNamespaces: { [key: string]: "defined" };
  let lasttype: string;

  Handlebars.registerHelper("getImport", function(context: IImport, options) {
    let baseclass = options.data.root as GeneratorBase;
    if (baseclass.name !== lasttype) {
      importedNamespaces = {};
      lasttype = baseclass.name;
    }

    // Return if module uses a parameter from its own module (no import necessary)
    if (context.type.module === baseclass.module) {
      return "";
    }

    // Check if module has an internal namespace and mark it as defined (to import multiple modules like this):
    // import * as basens from 'module/to/load';
    // type type1 = basens.type1;
    // type type2 = basens.type2;
    // etc...
    if (context.type.basename.indexOf(".") > -1) {
      const nsarr = context.type.basename.split(".");
      nsarr.pop();
      const ns = nsarr.join(".");
      if (importedNamespaces[ns]) {
        return "";
      } else {
        importedNamespaces[ns] = "defined";
        return `import { ${ns} } from "${context.type.module}";`;
      }
    }

    // Check if the imported type has an alias
    if (context.alias) {
      // distinguish classes, and rest. 
      if (context.type.kind === "class") {
        return `import * as ${context.type.basename}Import from "${
          context.type.module
        }";
            type ${context.alias} = ${context.type.basename}Import.default;`;
      } else {
        // Namespaces, enums and interfaces are processed here:
        return `import {${context.type.basename} as ${context.alias}} from "${
          context.type.module
        }";`;
      }

      // If type has no alias
    } else {
      switch (context.type.kind) {
        case "class":
          return `import ${context.type.basename} from "${
            context.type.module
          }";`;
        case "namespace":
          return `import * as ${context.type.basename} from "${context.type.module}";
          type ${context.type.basename} = any;`;
        default:
          return `import { ${context.type.basename} } from "${
            context.type.module
          }";`;
      }
    }
  });

  Handlebars.registerHelper("ifIsThis", function(type: string, options) {
    const pc = options.data._parent.root;
    if (type === "this") return true;
    if (pc instanceof ParsedClass) {
      if (checkIfIsTypeTheSame(pc, type)) {
        return options.fn(this);
      }
    }
    return options.inverse(this);
    // return options.inverse(this);
  });

  Handlebars.registerHelper("unlessCond", function(v1, operator, v2, options) {
    switch (operator) {
      case "==":
        return v1 == v2 ? options.inverse(this) : options.fn(this);
      case "===":
        return v1 === v2 ? options.inverse(this) : options.fn(this);
      case "!=":
        return v1 != v2 ? options.inverse(this) : options.fn(this);
      case "!==":
        return v1 !== v2 ? options.inverse(this) : options.fn(this);
      case "<":
        return v1 < v2 ? options.inverse(this) : options.fn(this);
      case "<=":
        return v1 <= v2 ? options.inverse(this) : options.fn(this);
      case ">":
        return v1 > v2 ? options.inverse(this) : options.fn(this);
      case ">=":
        return v1 >= v2 ? options.inverse(this) : options.fn(this);
      case "&&":
        return v1 && v2 ? options.inverse(this) : options.fn(this);
      case "||":
        return v1 || v2 ? options.inverse(this) : options.fn(this);
      default:
        return options.inverse(this);
    }
  });

  Handlebars.registerHelper("getNamespace", function(fullname: string) {
    const splitFullName = fullname.split(".");
    splitFullName.pop();
    return splitFullName.join(".");
  });

  // removeSAP
  Handlebars.registerHelper("removeSAP", function(fullname: string) {
    return fullname.replace(/^sap\./, "");
  });

  Handlebars.registerHelper("getName", function(fullname: string) {
    return fullname.split(".").pop();
  });

  Handlebars.registerHelper("toNamespace", function(fullname: string) {
    return fullname.replace(/\//g, ".");
  });

  Handlebars.registerHelper("documentThis", function(text: string) {
    return makeComment(styleJsDoc(text));
  });

  Handlebars.registerHelper("breakpointer", function(paramtocheck: any) {
    return paramtocheck;
  });
}

function checkIfIsTypeTheSame(pc: ParsedClass, type: string): boolean {
  if (pc.basename === type) {
    return true;
  } else {
    if (pc.baseclass) {
      return checkIfIsTypeTheSame(pc.baseclass, type);
    } else {
      return false;
    }
  }
}
