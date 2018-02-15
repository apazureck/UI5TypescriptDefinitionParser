import { ISymbol } from "./UI5DocumentationTypes";
import { LogLevel } from "./log";

export interface IConfig {
  preProcessing: {
    [jpath: string]: {
      jsonpath: string,
      comment: string,
      script: string,
    },
  }
  connection: {
    root: string;
    endpoints: string[];
  };
  /**
   * Maps given types from the documentation to a custom given type
   *
   * @type {{
   *         [key: string]: string;
   *     }}
   * @memberof IConfig
   */
  typeMap: {
    [key: string]: string;
  };
  /**
   * Found Enums in the namespaces
   *
   * @type {{
   *         [key: string]: string;
   *     }}
   * @memberof IConfig
   */
  enums: {
    [key: string]: string;
  };

  /**
   * Types given here will be overridden completele. That means no class, namespace or enum will be generated. The types will not be referenced as modules, etc.
   *
   * @type {{
   *         [key: string]: string;
   *     }}
   * @memberof IConfig
   */
  substitutedTypes: {
    [key: string]: string;
  };
  cacheApis: boolean;
  logLevel: string;

  postProcessing: {
    [fileName: string]: IPostProcessor[];
  };

  cleanParamNames: {
    [oldName: string]: string;
  };

  ambientTypes: {
    [typename: string]: any;
  };
}

export interface IPostProcessor {
  isRegex?: boolean;
  regexFlags?: string;
  searchString: string;
  replacement: string;
}

export interface IDictionary {
  [key: string]: string;
}

export interface ILogDecorator {
  log(message: string, sourceStack?: string): void;
}

export interface IImport {
  module: string;
  name: string;
  alias?: string;
}
