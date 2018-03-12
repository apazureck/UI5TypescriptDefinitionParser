import { IApi, ISymbol } from "./UI5DocumentationTypes";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { ParsedNamespace } from "./generators/entities/ParsedNamespace";
import { IConfig, ILogDecorator, IPostProcessor } from "./types";
import * as fs from "fs";
import * as ncp from "ncp";
import * as path from "path";
import { RestClient, IRestResponse } from "typed-rest-client/RestClient";
import * as mkdirp from "mkdirp";
import * as Handlebars from "handlebars";
import * as hbex from "./handlebarsExtensions";
hbex.registerHelpers(Handlebars);
import * as gulp from "gulp";
import * as gulptsf from "gulp-typescript-formatter";
import * as ts from "typescript";
import { Log, LogLevel } from "./log";
import * as ProgressBar from "progress";
import * as glob from "glob-all";
import * as jpath from "jsonpath";
import { ParsedModule } from "./generators/entities/ParsedModule";
import { ParsedBase } from "./generators/ParsedBase";
import { ParsedEnum } from "./generators/entities/ParsedEnum";

const startTime = Date.now();
Log.activate((message, level) => {
  const curTime = Date.now();
  console.log(curTime - startTime + " - " + message);
});

interface IObservedApis {
  [endpoint: string]: {
    loaded: boolean;
    api?: IApi;
  };
}

/**
 *
 *
 * @export
 * @class Parser
 */
export class Parser implements ILogDecorator {
  parseModules(modules: { [modulename: string]: { symbols: ISymbol[], generated: ParsedBase[], module?: ParsedModule } }, config: IConfig): void {

    for (const mname in this.modules) {
      if (this.modules.hasOwnProperty(mname)) {
        const mod = this.modules[mname];
        const file = path.join(config.outdir, "modules", mname + ".d.ts");
        if (!fs.existsSync(path.dirname(file))) {
          MakeDirRecursiveSync(path.dirname(file));
        }
        try {
          fs.writeFileSync(file, mod.module.typings, { encoding: "utf-8" });
        } catch (error) {
        }
      }
    }
  }
  private modules: { [modulename: string]: { symbols: ISymbol[], generated: ParsedBase[], module?: ParsedModule } } = {};
  getModules(): any {
    for (const symbolname in this.config.modularTypes) {
      if (this.config.modularTypes.hasOwnProperty(symbolname)) {
        const symbol = this.config.modularTypes[symbolname];
        if (!this.modules[symbol.module]) {
          this.modules[symbol.module] = {
            symbols: [],
            generated: []
          };
        }
        this.modules[symbol.module].symbols.push(symbol);
      }
    }

    for (const modname in this.modules) {
      if (this.modules.hasOwnProperty(modname)) {
        const mod = this.modules[modname];
        const isGlobal = this.config.globalModules[modname] !== undefined;

        for (const symbol of mod.symbols) {
          switch (symbol.kind) {
            case "namespace":
              const ns = new ParsedNamespace(
                symbol, this.config, this, this.config.loadedTemplates.modularNamespace, true);
              if (!isGlobal) { this.allNamespaces[symbol.name] = ns; }
              mod.generated.push(ns);
              break;
            case "class":
              const c = new ParsedClass(
                symbol,
                this.config.loadedTemplates.modularClass,
                this.config,
                this,
                false
              );
              if (!isGlobal) { this.allClasses[c.name] = c; }
              mod.generated.push(c);
              break;
            case "enum":
              const e = new ParsedEnum(
                this.config,
                this,
                symbol,
                this.config.loadedTemplates.modularEnum
              );
              mod.generated.push(e);
              break;
            case "interface":
              const i = new ParsedClass(symbol,
                this.config.loadedTemplates.modularInterface,
                this.config,
                this,
                false);
              mod.generated.push(i);
              break;
            default:
              this.logger.Error("Unknown Symbol Kind");
              break;
          }
        }
        mod.module = new ParsedModule(modname, this.config, mod.generated, this, this.config.loadedTemplates.module, isGlobal);
      }
    }
  }
  allInterfaces: ParsedClass[] = [];
  private config: IConfig;
  private outfolder: string;
  private observedAPIs: IObservedApis = {};

  private currentApi: IApi;
  private logger: Log;
  private allClasses: { [name: string]: ParsedClass } = {};
  private allNamespaces: { [name: string]: ParsedNamespace } = {};

  constructor(private configPath: string) {
    this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    this.logger = new Log("Parser", LogLevel.getValue(this.config.logLevel));
    this.logger.Trace("Started Logger");
    this.config.loadedTemplates = {} as any;
    this.config.loadedTemplates.ambientClass = Handlebars.compile(
      fs.readFileSync(this.config.templates.ambientClass, "utf-8"),
      {
        noEscape: true
      }
    );
    this.config.loadedTemplates.ambientEnum = Handlebars.compile(
      fs.readFileSync(this.config.templates.ambientEnum, "utf-8"),
      {
        noEscape: true
      }
    );
    this.config.loadedTemplates.modularEnum = Handlebars.compile(
      fs.readFileSync(this.config.templates.modularEnum, "utf-8"),
      {
        noEscape: true
      }
    );
    this.config.loadedTemplates.modularClass = Handlebars.compile(
      fs.readFileSync(this.config.templates.modularClass, "utf-8"),
      {
        noEscape: true
      }
    );
    this.config.loadedTemplates.ambientInterface = Handlebars.compile(
      fs.readFileSync(this.config.templates.ambientInterface, "utf-8"),
      { noEscape: true }
    );
    this.config.loadedTemplates.modularInterface = Handlebars.compile(fs.readFileSync(this.config.templates.modularInterface, "utf-8"),
      { noEscape: true });
    this.config.loadedTemplates.ambientNamespace = Handlebars.compile(
      fs.readFileSync(this.config.templates.ambientNamespace, "utf-8"),
      { noEscape: true }
    );
    this.config.loadedTemplates.modularNamespace = Handlebars.compile(
      fs.readFileSync(this.config.templates.modularNamespace, "utf-8"),
      { noEscape: true }
    );
    this.config.loadedTemplates.module = Handlebars.compile(fs.readFileSync(this.config.templates.module, "utf-8"), { noEscape: true });
  }

  async GenerateDeclarations(outfolder?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      this.outfolder = outfolder || this.config.outdir;
      let info = { generatedClasses: 0 };
      // Create rest client
      const rc = new RestClient("Agent", this.config.connection.root);
      this.logger.Info("Generating Declarations");

      // Check if each endpoint in the config is cached (if cache enabled), otherwise add it to the request list
      for (const endpoint of this.config.connection.endpoints) {
        const cachefile = path.join("apis", endpoint.replace(/\//g, "."));

        if (this.config.cacheApis) {
          this.logger.Info("Using cache, Looking for cache file " + cachefile);
          if (fs.existsSync(cachefile)) {
            this.observedAPIs[endpoint] = {
              loaded: true,
              api: JSON.parse(fs.readFileSync(cachefile, "utf-8"))
            };
            this.logger.Info("File found!");
            continue;
          } else {
            this.logger.Info(
              "No cached file found, requesting from " +
              this.config.connection.root
            );
            this.observedAPIs[endpoint] = {
              loaded: false
            };
          }
        } else {
          this.observedAPIs[endpoint] = {
            loaded: false
          };
        }
      }

      // Callback for get
      const received = async (value: IRestResponse<any>, endpoint: string) => {
        this.receivedAPI(endpoint, value.result);

        // if all observed apis are loaded create
        if (this.checkIfAllApisArePresent()) {
          try {
            this.logger.Info("Received all apis");
            await this.generate();
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      };

      // Request all not cached/loaded enpoints. Use then instead of await to make requests simultaneously
      for (const endpoint of this.config.connection.endpoints) {
        if (!this.observedAPIs[endpoint].loaded) {
          this.logger.Info("Loading endpoint '" + endpoint + "'");
          const value = await rc.get(
            this.config.connection.root + "/" + endpoint
          );
          received(value, endpoint);
        }
      }

      // if all observed apis are loaded create
      if (this.checkIfAllApisArePresent()) {
        try {
          this.logger.Info("Received all apis");
          await this.generate();
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  private checkIfAllApisArePresent(): boolean {
    let run = true;
    for (const ep in this.observedAPIs) {
      if (this.observedAPIs[ep].loaded === false) {
        run = false;
      }
    }
    return run;
  }

  private receivedAPI(endpoint: string, api: IApi) {
    this.observedAPIs[endpoint] = {
      loaded: true,
      api: api
    };

    // cache apis if useCache is active
    if (this.config.cacheApis) {
      MakeDirRecursiveSync("apis");
      const filename = path.join("apis", endpoint.replace(/\//g, "."));
      if (endpoint && !fs.existsSync(filename)) {
        const api = this.observedAPIs[endpoint].api;
        fs.writeFileSync(filename, JSON.stringify(api), "utf-8");
      }
    }
  }

  private async generate() {
    this.preprocessApis(this.observedAPIs);

    this.logger.Info("Creating ambient type map");
    this.createGlobalAmbientAndModularDictionary(this.observedAPIs);

    this.getNamespaces(this.config);

    this.logger.Info("Scanning for interfaces");
    this.getInterfaces(this.config);

    this.logger.Info("Scanning apis for classes");
    this.getClasses(this.config);

    this.logger.Info("Creating all modules");
    this.getModules();

    this.logger.Info("Postprocessing all found classes");

    let classcount = 0;
    for (const cname in this.allClasses) {
      classcount++;
      if (this.allClasses.hasOwnProperty(cname)) {
        const c = this.allClasses[cname];
        if (c.extends) {
          try {
            c.baseclass = this.allClasses[c.extends]
          } catch (error) {
            this.logger.Info("Could not find baseclass for " + c.basename);
          }
        }
      }
    }

    this.CreateClassOverloads();

    this.generateSubbedTypeFile("substituted.d.ts");

    this.logger.Info("Creating class files");
    console.log();

    // Create files
    this.ParseAllClasses(this.allClasses, classcount);
    this.createNamespaceFiles();
    this.ParseAllInterfaces(this.allInterfaces);
    this.parseEnums(this.config);
    this.parseModules(this.modules, this.config);

    this.logger.Info("Copying replacement files");
    this.replaceFiles("replacements", this.outfolder);

    // FOrmat all files
    this.logger.Info("*** Formatting output files");
    await this.formatAllFiles();

    this.logger.Info("Replacing Post Processing directives");
    this.doFilePostProcessingReplacements(this.config);

    // FOrmat all files again, as the user will replace the formatted strings.
    this.logger.Info("*** Formatting output files after post processing");
    await this.formatAllFiles();

    this.logger.Info(
      "Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done"
    );
  }

  // 1st step: Preprocess all apis

  preprocessApis(apis: IObservedApis): void {
    this.logger.Info("Running preprocessing");
    const apicount = Object.keys(apis).length;
    for (const entry in this.config.preProcessing) {
      this.logger.Info("Running '" + entry + "'");
      const ppitem = this.config.preProcessing[entry];
      if (ppitem.comment) {
        this.logger.Info(ppitem.comment);
      }
      const func = new Function("val", `${ppitem.script}\nreturn val;`);
      let debugwrapper = (val): void => {
        try {
          this.logger.Info("Caught Object: " + val.name || "unknown");
          this.logger.Debug(JSON.stringify(val));
        } catch (error) { }
        return func(val);
      };
      for (const endpointname in apis) {
        try {
          const api = apis[endpointname];
          const paths = jpath.paths(api.api, ppitem.jsonpath);
          for (const path of paths) {
            jpath.apply(api.api, jpath.stringify(path), debugwrapper);
          }
        } catch (error) {
          if (error.message.startsWith("Lexical error")) {
            this.logger.Error(
              "Error in used jsonpath. See https://www.npmjs.com/package/jsonpath for how to use jsonpath."
            );
            this.logger.Error("Error Message: " + error.message);
            continue;
          }
          this.logger.Error("Error preprocessing");
          this.logger.Error(JSON.stringify(error));
        }
      }
    }
  }

  // 2nd step: devide all types in ambient and modular types

  createGlobalAmbientAndModularDictionary(allApis: {
    [endpoint: string]: {
      loaded: boolean;
      api?: IApi;
    };
  }): void {
    this.config.modularTypes = {};
    this.config.ambientTypes = {};
    for (const endpoint in allApis) {
      if (allApis[endpoint]) {
        this.createAmbientDictionaryFromApi(allApis[endpoint].api);
      }
    }
  }

  private addModularSymbol(symbol: ISymbol) {
    if (this.config.modularTypes[symbol.name]) {
      this.logger.Error(
        "Modular Symbol" + symbol.name + "  is declared multiple times!"
      );
    } else {
      // if (symbol.export === undefined) {
      //   symbol.module += "/" + symbol.basename;
      // }
      this.config.modularTypes[symbol.name] = symbol;
    }
  }

  private addAmbientSymbol(symbol: ISymbol) {
    if (this.config.ambientTypes[symbol.name]) {
      this.logger.Error(
        "Ambient Symbol '" + symbol.name + "' is declared multiple times!"
      );
    } else {
      this.config.ambientTypes[symbol.name] = symbol;
    }
  }

  private addGlobalSymbol(symbol: ISymbol) {
    this.addAmbientSymbol(symbol);
    this.addModularSymbol(symbol);
  }

  createAmbientDictionaryFromApi(api: IApi) {
    for (const symbol of api.symbols) {
      if (this.config.globalModules[symbol.module]) {
        this.addGlobalSymbol(symbol);
      } else if (symbol.module.match(/(\w+[\."])+/)) {
        if (symbol.forceModular) {
          this.addModularSymbol(symbol);
        }
        else {
          this.addAmbientSymbol(symbol);
        }
      } else if (symbol.module.match(/^(\w+[\/"])+/)) {
        if (symbol.forceAmbient) {
          this.addAmbientSymbol(symbol);
        } else {
          this.addModularSymbol(symbol);
        }
      } else {
        this.logger.Error("Unknown Symbol type" + symbol.name);
      }
    }
  }

  // 3rd step: Create all enums (all ambient, as they are just strings for now)

  private parseEnums(config: IConfig): { generatedEnumCount: number } {
    let info = { generatedEnumCount: 0 };

    // Create out folder if not existing
    if (!fs.existsSync(this.outfolder)) {
      MakeDirRecursiveSync(this.outfolder);
    }

    // check if enums folder exists and create it
    if (!fs.existsSync(path.join(this.outfolder, "enums"))) {
      MakeDirRecursiveSync(path.join(this.outfolder, "enums"));
    }

    for (const typename in config.ambientTypes) {
      const type = config.ambientTypes[typename];
      this.createEnum(type, info, this.config.loadedTemplates.ambientEnum);
    }
    // for (const typename in config.modularTypes) {
    //   const type = config.modularTypes[typename];
    //   this.createEnum(type, info, this.modularEnumTemplate)
    // }
    return info;
  }

  private createEnum(
    type: ISymbol,
    info: { generatedEnumCount: number },
    template: HandlebarsTemplateDelegate
  ): boolean {
    if (type.kind === "enum") {
      const filepath = path.join(this.outfolder, "enums", type.name + ".d.ts");
      if (fs.existsSync(filepath)) {
        this.logger.Error("File already exists");
      } else {
        fs.writeFileSync(filepath, template(type), {
          encoding: "utf-8"
        });
      }
      info.generatedEnumCount++;
      return true;
    }
    return false;
  }

  // 4th step: Parse all Namespaces (all ambient)

  private getNamespaces(config: IConfig): { generatedNamespaceCount: number } {
    let info = { generatedNamespaceCount: 0 };

    // Check outfolder
    if (!fs.existsSync(this.outfolder)) {
      MakeDirRecursiveSync(this.outfolder);
    }

    // Create namespace folder
    if (!fs.existsSync(path.join(this.outfolder, "namespaces"))) {
      MakeDirRecursiveSync(path.join(this.outfolder, "namespaces"));
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.pushNamespace(s, info, false);
      info.generatedNamespaceCount++;
    }

    // for (const symbolname in config.modularTypes) {
    //   const s = config.modularTypes[symbolname];
    //   if (s.name.replace(/\./g, "/") === s.module) {
    //     this.pushNamespace(s, info, true);
    //   } else {
    //     this.pushNamespace(s, info, false);
    //   }
    //   info.generatedNamespaceCount++;
    // }

    return info;
  }

  private pushNamespace(
    s: ISymbol,
    info: { generatedNamespaceCount: number },
    isModule: boolean
  ): ParsedNamespace {
    switch (s.kind) {
      case "namespace":
        const ns = new ParsedNamespace(s, this.config, this, isModule ? this.config.loadedTemplates.modularNamespace : this.config.loadedTemplates.ambientNamespace, isModule);

        this.allNamespaces[ns.name] = ns;
        // Write to file
        // TODO: Create folder structure
        // fs.writeFileSync(path.join(this.outfolder, "classes", s.name + ".d.ts"), cstring, 'utf-8');
        // this.log("Created Declaration for class '" + s.name + "'");
        info.generatedNamespaceCount++;
        return ns;
      default:
        return undefined;
    }
  }

  private createNamespaceFiles() {
    this.logger.Info("Creating Namespace files");
    // Make namespace files
    for (const nsname in this.allNamespaces) {
      if (this.allNamespaces.hasOwnProperty(nsname)) {
        const ns = this.allNamespaces[nsname];
        if (ns.isModule) {
          continue;
        }
        let filepath = path.join(
          this.outfolder,
          ns.isModule ? "" : "namespaces",
          ns.module + ".d.ts"
        );
        this.log("Creating namespace " + filepath);
        try {
          // const nsstring = ns.toString();
          MakeDirRecursiveSync(path.dirname(filepath));
          try {
            if (fs.existsSync(filepath)) {
              filepath = path.join(
                this.outfolder,
                ns.isModule ? "" : "namespaces",
                ns.module + "." +
                ns.basename + ".d.ts"
              );
              ns.appended = true;
              fs.appendFileSync(filepath, ns.parse(), { encoding: "utf-8" });
            } else {
              fs.writeFileSync(filepath, ns.parse(), { encoding: "utf-8" });
            }
          } catch (error) {
            console.error(
              "Error writing file " + filepath + ": " + error.toString()
            );
          }
        } catch (error) {
          console.error(
            "Error creating folder for file " + filepath + ": " + error.toString()
          );
        }
      }
    }
  }

  // 5th step: get all interfaces (all ambient)

  private getInterfaces(config: IConfig): { generatedClassCount: number } {
    let info = { generatedClassCount: 0 };

    if (!fs.existsSync(this.outfolder)) {
      MakeDirRecursiveSync(this.outfolder);
    }
    if (!fs.existsSync(path.join(this.outfolder, "interfaces"))) {
      MakeDirRecursiveSync(path.join(this.outfolder, "interfaces"));
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.createInterface(s, info, this.config.loadedTemplates.ambientInterface);
    }

    // for (const symbolname in config.modularTypes) {
    //   const s = config.modularTypes[symbolname];
    //   if (s.forceAmbient === true) {
    //     this.createInterface(s, info, this.ambientInterfaceTemplate);
    //   }
    //   this.createInterface(s, info, this.modularInterfaceTemplate);
    // }

    this.log("Created " + info.generatedClassCount);
    return info;
  }

  private createInterface(s: ISymbol, info: { generatedClassCount: number }, template: HandlebarsTemplateDelegate) {
    switch (s.kind) {
      case "interface":
        const i = new ParsedClass(s, template, this.config, this);
        this.allInterfaces.push(i);
        info.generatedClassCount++;
        return true;
      default:
        return false;
    }
  }

  private ParseAllInterfaces(allInterfaces: ParsedClass[]): void {
    const classcount = allInterfaces.length;
    let generatedclasses = 0;
    for (const c of allInterfaces) {
      this.ParseInterface(c);
      generatedclasses++;
    }
  }

  private ParseInterface(c: ParsedClass): void {
    const filepath = path.join(
      this.outfolder,
      "interfaces",
      c.module + "." + c.basename + ".d.ts"
    );
    this.log("Creating interface " + filepath);
    try {
      MakeDirRecursiveSync(path.dirname(filepath));
      try {
        if (fs.existsSync(filepath)) {
          this.logger.Error("File already exists");
        } else {
          fs.writeFileSync(filepath, c.toString(), { encoding: "utf-8" });
        }
      } catch (error) {
        console.error(
          "Error writing file " + filepath + ": " + error.toString()
        );
      }
    } catch (err) {
      console.error(
        "Error creating folder for file " + filepath + ": " + err.toString()
      );
    }
  }

  // 6th step: parse all classes

  private ParseAllClasses(allClasses: { [name: string]: ParsedClass }, classcount: number): void {
    let bar = createNewProgressBar("Creating class files", classcount);
    let generatedclasses = 0;
    for (const cname in allClasses) {
      if (allClasses.hasOwnProperty(cname)) {
        const c = allClasses[cname];
        bar.tick();
        if (this.config.ambientTypes[c.name])
          this.ParseClass(c);
        generatedclasses++;
      }
    }
  }

  private ParseClass(c: ParsedClass): void {
    let filepath = path.join(this.outfolder, "classes", c.module + ".d.ts");
    if (fs.existsSync(filepath)) {
      filepath = path.join(
        this.outfolder,
        "classes",
        c.module + "." + c.basename + ".d.ts"
      );
    }
    this.log("Creating class " + filepath);
    try {
      MakeDirRecursiveSync(path.dirname(filepath));
      try {
        fs.writeFileSync(filepath, c.toString(), { encoding: "utf-8" });
      } catch (error) {
        console.error(
          "Error writing file " + filepath + ": " + error.toString()
        );
      }
    } catch (err) {
      console.error(
        "Error creating folder for file " + filepath + ": " + err.toString()
      );
    }
  }

  private CreateClassOverloads() {
    const baseclasses: ParsedClass[] = [];
    for (const cname in this.allClasses) {
      if (this.allClasses.hasOwnProperty(cname)) {
        const c = this.allClasses[cname];
        if (!c.baseclass) {
          baseclasses.push(c);
        }
      }
    }

    this.logger.Info("Pushing overloads for classes.");
    var bar = createNewProgressBar("Pushing overloads", baseclasses.length);
    for (const bc of baseclasses) {
      bar.tick();
      bc.pushOverloads();
    }
    this.logger.Info("Overloads done");
  }

  private async getClasses(
    config: IConfig
  ): Promise<{ generatedClassCount: number }> {
    let info = { generatedClassCount: 0 };

    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.pushClass(s, info, true);
    }

    // for (const symbolname in config.modularTypes) {
    //   const s = config.modularTypes[symbolname];
    //   this.pushClass(s, info);
    // }
    this.log("Created " + info.generatedClassCount);
    return info;
  }

  private pushClass(
    s: ISymbol,
    info: { generatedClassCount: number },
    isAmbient?: boolean
  ) {
    switch (s.kind) {
      case "class":
        this.allClasses[s.name] =
          new ParsedClass(
            s,
            isAmbient ? this.config.loadedTemplates.ambientClass : this.config.loadedTemplates.modularClass,
            this.config,
            this,
            isAmbient
          );
        info.generatedClassCount++;
        break;
      default:
    }
  }

  // 7th step: Do post processing

  private escapeRegExp(str: string): string {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  private doFilePostProcessingReplacements(config: IConfig): void {
    for (const moduleName in config.postProcessing) {
      const files = glob.sync(
        path.join(this.outfolder, moduleName + ".d.ts")
      ) as string[];
      const postProcessor = config.postProcessing[moduleName];
      for (const file of files) {
        try {
          this.postProcessFile(file, postProcessor);
        } catch (error) {
          this.logger.Error(
            "Error occurred during postprocessing " +
            file +
            " with post processor " +
            moduleName +
            ": " +
            JSON.stringify(error)
          );
        }
      }
    }
  }

  private postProcessFile(
    fullFilePath: string,
    postProcessor: IPostProcessor[]
  ): void {
    let content = fs.readFileSync(fullFilePath, "utf-8");
    for (const replacer of postProcessor) {
      const replaceregex = replacer.isRegex
        ? new RegExp(replacer.searchString, replacer.regexFlags)
        : new RegExp(this.escapeRegExp(replacer.searchString), "g");
      content = content.replace(replaceregex, replacer.replacement);
    }
    fs.writeFileSync(fullFilePath, content);
  }

  async formatAllFiles(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      gulp
        .src(this.outfolder + "/**/*.ts")
        .pipe(gulptsf({}))
        .pipe(gulp.dest(this.outfolder))
        .on("end", () => resolve())
        .on("error", () => reject());
    });
  }

  private replaceFiles(sourcePath: string, outPath: string) {
    if (fs.existsSync(sourcePath))
      ncp.ncp(sourcePath, outPath, error => {
        if (error) {
          console.error("Could not copy: " + error.toString());
        }
      });
  }

  private generateSubbedTypeFile(filename: string): void {
    fs.writeFileSync(
      path.join(this.outfolder, filename),
      this.getSubstitutedTypes(),
      { encoding: "utf-8" }
    );
  }

  private getSubstitutedTypes(): string {
    let types: string[] = [];
    for (const tkey in this.config.substitutedTypes) {
      if (tkey) {
        types.push(this.config.substitutedTypes[tkey]);
      }
    }
    return types.join("\n");
  }

  log(message: string, sourceStack?: string) {
    sourceStack = sourceStack || "";

    if (this.currentApi)
      this.logger.Debug(
        "Library '" +
        this.currentApi.library +
        "' -> " +
        sourceStack +
        ": " +
        message
      );
    else {
      this.logger.Debug(sourceStack + ": " + message);
    }
  }
}

function MakeDirRecursiveSync(dirpath): void {
  mkdirp.sync(dirpath);
}

function createNewProgressBar(
  title: string,
  endcount: number,
  tokens?: string[]
): ProgressBar {
  return new ProgressBar(
    title +
    (tokens ? ": " + tokens.join(" ") : " ") +
    "[:bar] :percent :etas | Ran :elapsed",
    {
      complete: "=",
      incomplete: ".",
      width: 50,
      total: endcount
    }
  );
}
