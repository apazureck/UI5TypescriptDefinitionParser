import { IApi, ISymbol } from "./UI5DocumentationTypes";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { ParsedNamespace } from "./generators/entities/ParsedNamespace";
import { EnumGenerator } from "./generators/EnumGenerator";
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
  allInterfaces: ParsedClass[] = [];
  private config: IConfig;
  private outfolder: string;

  private observedAPIs: IObservedApis = {};

  private currentApi: IApi;
  private logger: Log;

  private interfaceTemplate = fs.readFileSync(
    "templates/interface.d.ts.hb",
    "utf8"
  );

  enumTemplate: HandlebarsTemplateDelegate<any> = Handlebars.compile(
    fs.readFileSync("templates/enums.d.ts.hb", "utf-8"),
    {
      noEscape: true
    }
  );

  private allClasses: ParsedClass[] = [];
  private allNamespaces: ParsedNamespace[] = [];

  classTemplate = fs.readFileSync("templates/classModule.d.ts.hb", "utf8");

  constructor(private configPath: string) {
    this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    // overwrite setting
    this.logger = new Log("Parser", LogLevel.getValue(this.config.logLevel));
    this.logger.Trace("Started Logger");
  }
  async GenerateDeclarations(outfolder: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      this.outfolder = outfolder;
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
    this.createAmbientAndModularDictionary(this.observedAPIs);

    await this.parseEnums(this.config);

    await this.getNamespaces(this.config);
    await this.createNamespaceFiles();

    this.logger.Info("Scanning for interfaces");
    await this.getInterfaces(this.config);

    await this.ParseAllInterfaces(this.allInterfaces);

    this.logger.Info("Scanning apis for classes");
    this.getClasses(this.config);

    this.logger.Info("Postprocessing all found classes");
    for (const c of this.allClasses) {
      if (c.extendedClass) {
        const classmodulename = c.extendedClass.replace(/\./g, "/");
        try {
          c.baseclass = this.allClasses
            .filter((value, index, array) => value.fullName === classmodulename)
            .pop();
        } catch (error) {
          this.logger.Info("Could not find baseclass for " + c.name);
        }
      }
    }

    this.CreateClassOverloads();

    this.generateSubbedTypeFile("substituted.d.ts");

    this.logger.Info("Creating class files");
    console.log();
    await this.ParseAllClasses(this.allClasses);

    this.logger.Info("Copying replacement files");
    this.replaceFiles("replacements", this.outfolder);

    // FOrmat all files
    this.logger.Info("*** Formatting output files");
    await this.formatAllFiles();

    this.logger.Info("Replacing Post Processing directives");
    this.doFilePostProcessingReplacements(this.config);

    // FOrmat all files again, as the user will replace the formatted strings.
    this.logger.Info("*** Formatting output files");
    await this.formatAllFiles();

    this.logger.Info(
      "Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done"
    );
  }

  private async createNamespaceFiles() {
    this.logger.Info("Creating Namespace files");
    // Make namespace files
    const nstemplate = Handlebars.compile(
      fs.readFileSync("templates/namespace.d.ts.hb", "utf-8"),
      {
        noEscape: true
      }
    );
    for (const ns of this.allNamespaces) {
      const filepath = path.join(
        this.outfolder,
        "namespaces",
        ns.name + ".d.ts"
      );
      this.log("Creating namespace " + filepath);
      try {
        // const nsstring = ns.toString();
        await MakeDirRecursiveSync(path.dirname(filepath));
        try {
          fs.writeFileSync(filepath, nstemplate(ns), { encoding: "utf-8" });
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
      let bar = createNewProgressBar("Processing", apicount, ["api: :api"]);
      const func = new Function("val", `${ppitem.script}\nreturn val;`);
      let debugwrapper = (val): void => {
        return func(val);
      };
      for (const endpointname in apis) {
        try {
          const api = apis[endpointname];
          const paths = jpath.paths(api.api, ppitem.jsonpath);
          for (const path of paths) {
            jpath.apply(api.api, jpath.stringify(path), debugwrapper);
          }
          bar.tick({ api: endpointname });
        } catch (error) {
          this.logger.Error("Error preprocessing");
          this.logger.Error(JSON.stringify(error));
        }
      }
    }
  }

  // 2nd step: devide all types in ambient and modular types

  createAmbientAndModularDictionary(allApis: {
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

  createAmbientDictionaryFromApi(api: IApi) {
    for (const symbol of api.symbols) {
      if (symbol.module.match(/(\w+[\."])+/)) {
        if (this.config.ambientTypes[symbol.name]) {
          this.logger.Error(
            "Ambient Symbol" + symbol.name + " is declared multiple times!"
          );
        } else {
          this.config.ambientTypes[symbol.name] = symbol;
        }
      } else if (symbol.module.match(/^(\w+[\/"])+/)) {
        if (this.config.modularTypes[symbol.name]) {
          this.logger.Error(
            "Modular Symbol" + symbol.name + " is declared multiple times!"
          );
        } else {
          this.config.modularTypes[symbol.name] = symbol;
        }
      } else {
        this.logger.Error("Unknown Symbol type" + symbol.name);
      }
    }
  }

  // 3rd step: Create all enums (all ambient, as they are just strings for now)

  private async parseEnums(
    config: IConfig
  ): Promise<{ generatedEnumCount: number }> {
    let info = { generatedEnumCount: 0 };

    // Create out folder if not existing
    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }

    // check if enums folder exists and create it
    if (!fs.existsSync(path.join(this.outfolder, "enums"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "enums"));
    }

    for (const typename in config.ambientTypes) {
      const type = config.ambientTypes[typename];
      this.createEnum(type, info);
    }
    for (const typename in config.modularTypes) {
      const type = config.modularTypes[typename];
      this.createEnum(type, info);
      if (config.ambientTypes[typename]) {
        let i = 0;
      } else {
        config.ambientTypes[typename] = config.modularTypes[typename];
        delete config.ambientTypes[typename];
      }
    }
    return info;
  }

  private createEnum(type: ISymbol, info: { generatedEnumCount: number }) {
    if (
      type.kind === "enum" ||
      (type.kind === "namespace" && this.config.enums[type.name] !== undefined)
    ) {
      fs.writeFileSync(
        path.join(this.outfolder, "enums", type.name + ".d.ts"),
        this.enumTemplate(type),
        { encoding: "utf-8" }
      );
      info.generatedEnumCount++;
    }
  }

  // 4th step: Parse all Namespaces (all ambient)

  private async getNamespaces(
    config: IConfig
  ): Promise<{ generatedNamespaceCount: number }> {
    let info = { generatedNamespaceCount: 0 };

    // Check outfolder
    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }

    // Create namespace folder
    if (!fs.existsSync(path.join(this.outfolder, "namespaces"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "namespaces"));
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.pushNamespace(s, info);
    }

    for (const symbolname in config.modularTypes) {
      const s = config.modularTypes[symbolname];
      this.pushNamespace(s, info);
      if (config.ambientTypes[symbolname]) {
        let i = 0;
      } else {
        config.ambientTypes[symbolname] = config.modularTypes[symbolname];
        delete config.modularTypes[symbolname];
      }
    }

    return info;
  }

  private pushNamespace(s: ISymbol, info: { generatedNamespaceCount: number }) {
    switch (s.kind) {
      case "namespace":
        const ns = new ParsedNamespace(s, this.config, this);
        this.allNamespaces.push(ns);
        // Write to file
        // TODO: Create folder structure
        // fs.writeFileSync(path.join(this.outfolder, "classes", s.name + ".d.ts"), cstring, 'utf-8');
        // this.log("Created Declaration for class '" + s.name + "'");
        info.generatedNamespaceCount++;
        break;
      default:
        this.log("New Type discovered: " + s.kind);
    }
  }

  // 5th step: get all interfaces (all ambient)

  private async getInterfaces(
    config: IConfig
  ): Promise<{ generatedClassCount: number }> {
    let info = { generatedClassCount: 0 };

    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }
    if (!fs.existsSync(path.join(this.outfolder, "interfaces"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "interfaces"));
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.createInterface(s, info);
    }

    for (const symbolname in config.modularTypes) {
      const s = config.modularTypes[symbolname];
      this.createInterface(s, info);
      if (config.ambientTypes[symbolname]) {
        let i = 0;
      } else {
        config.ambientTypes[symbolname] = config.modularTypes[symbolname];
        delete config.modularTypes[symbolname];
      }
    }

    this.log("Created " + info.generatedClassCount);
    return info;
  }

  private createInterface(s: ISymbol, info: { generatedClassCount: number }) {
    switch (s.kind) {
      case "interface":
        const i = new ParsedClass(s, this.interfaceTemplate, this.config, this);
        this.allInterfaces.push(i);
        info.generatedClassCount++;
        break;
      default:
    }
  }

  private async ParseAllInterfaces(
    allInterfaces: ParsedClass[]
  ): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const classcount = allInterfaces.length;
      let generatedclasses = 0;
      for (const c of allInterfaces) {
        try {
          await this.ParseInterface(c);
          generatedclasses++;
          if (!(generatedclasses < classcount)) {
            resolve();
          }
        } catch {
          generatedclasses++;
        }
      }
    });
  }

  private async ParseInterface(c: ParsedClass): Promise<void> {
    const filepath = path.join(
      this.outfolder,
      "interfaces",
      c.fullName + "." + c.name + ".d.ts"
    );
    this.log("Creating interface " + filepath);
    try {
      await MakeDirRecursiveSync(path.dirname(filepath));
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

  // 6th step: parse all classes

  private async ParseAllClasses(allClasses: ParsedClass[]): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      let bar = createNewProgressBar("Creating class files", allClasses.length);
      const classcount = allClasses.length;
      let generatedclasses = 0;
      for (const c of allClasses) {
        try {
          bar.tick();
          await this.ParseClass(c);
          generatedclasses++;
          if (!(generatedclasses < classcount)) {
            resolve();
          }
        } catch {
          generatedclasses++;
        }
      }
    });
  }

  private async ParseClass(c: ParsedClass): Promise<void> {
    const filepath = path.join(this.outfolder, "classes", c.fullName + ".d.ts");
    this.log("Creating class " + filepath);
    try {
      await MakeDirRecursiveSync(path.dirname(filepath));
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
    const baseclasses = this.allClasses.filter(
      (value, index, array) => !value.baseclass
    );
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
    if (!fs.existsSync(path.join(this.outfolder, "classes"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "classes"));
    }

    for (const symbolname in config.ambientTypes) {
      const s = config.ambientTypes[symbolname];
      this.pushClass(s, info);
    }

    for (const symbolname in config.modularTypes) {
      const s = config.modularTypes[symbolname];
      this.pushClass(s, info);
    }
    this.log("Created " + info.generatedClassCount);
    return info;
  }

  private pushClass(s: ISymbol, info: { generatedClassCount: number }) {
    switch (s.kind) {
      case "class":
        this.allClasses.push(
          new ParsedClass(s, this.classTemplate, this.config, this)
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

function MakeDirRecursiveSync(dirpath): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    mkdirp(dirpath, (err, made) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
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
