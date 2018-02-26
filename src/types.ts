import {ParsedNamespace} from './generators/entities/ParsedNamespace';
import { ISymbol } from "./UI5DocumentationTypes";
import { LogLevel } from "./log";

export interface IConfig {
  templates: {
    ambientInterface: string;
    modularInterface: string
    ambientClass: string,
    modularClass: string,
    ambientEnum: string;
    modularEnum: string;
    modularNamespace: string;
    ambientNamespace: string;
  }
  outdir: string,
  preProcessing: {
    [jpath: string]: {
      jsonpath: string;
      comment: string;
      script: string;
    };
  };
  connection: {
    root: string;
    endpoints: string[];
  };
  namespaceModules: {[moduleName: string]: ParsedNamespace[]}
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
    [typename: string]: ISymbol;
  };
  modularTypes: {
    [typename: string]: ISymbol;
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
  type: ISymbol
  alias?: string;
}

export enum OverloadFlags {
  None = 0,
  Parameters = 1 << 0,
  ReturnType = 1 << 1,
  Visibility = 1 << 2
}