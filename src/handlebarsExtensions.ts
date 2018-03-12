import * as Handlebars from "handlebars";
import {
  styleJsDoc,
  makeComment,
  ParsedBase
} from "./generators/ParsedBase";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { IType } from "./types";
import { ISymbol } from "./UI5DocumentationTypes";
export function registerHelpers(Handlebars: any) {
  Handlebars.registerHelper("ifCond", function (
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

  Handlebars.registerHelper("ifHasNamespace", function (v1: string, options) {
    if(!v1)
      return options.inverse(this);
    return v1.split(".").length > 1 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("unlessHasNamespace", function (v1: string, options) {
    if(!v1)
      return options.fn(this);
    return v1.split(".").length > 1 ? options.inverse(this) : options.fn(this);
  });

  let importedNamespaces: { [key: string]: "defined" };
  let lasttype: string;

  Handlebars.registerHelper("ifIsThis", function (type: string, options) {
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

  Handlebars.registerHelper("unlessCond", function (v1, operator, v2, options) {
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

  Handlebars.registerHelper("getNamespace", function (fullname: string) {
    const splitFullName = fullname.split(".");
    splitFullName.pop();
    return splitFullName.join(".");
  });

  Handlebars.registerHelper("getImport", function (imp: IType) {
    if(imp.importedFromNamespace) {
      return `type ${imp.alias || imp.type.basename} = ${imp.importedFromNamespace}.${imp.type.basename}`;
    }
    if (imp.isDefaultExport) {
      return `import ${imp.alias || imp.type.basename} from "${imp.type.module}"`;
    } else {
      return `import { ${imp.type.basename} ${imp.alias ? ("as " + imp.alias) : ""} } from "${imp.type.module}"`
    }
  })

  // removeSAP
  Handlebars.registerHelper("removeSAP", function (fullname: string) {
    return fullname.replace(/^sap\./, "");
  });

  Handlebars.registerHelper("getName", function (fullname: string) {
    return fullname.split(".").pop();
  });

  Handlebars.registerHelper("toNamespace", function (fullname: string) {
    return fullname.replace(/\//g, ".");
  });

  Handlebars.registerHelper("documentThis", function (text: string) {
    return makeComment(styleJsDoc(text));
  });

  Handlebars.registerHelper("debug", function (paramtocheck: any) {
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
