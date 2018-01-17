import * as Handlebars from "handlebars";
import { styleJsDoc, makeComment } from './generators/GeneratorBase';
export function registerHelpers(Handlebars: any) {
  Handlebars.registerHelper("ifCond", function(
    v1,
    operator: string,
    v2,
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

  Handlebars.registerHelper("getName", function(fullname: string) {
    return fullname.split(".").pop();
  });

  Handlebars.registerHelper("documentThis", function(text: string) {
    return makeComment(styleJsDoc(text));
  });
}
