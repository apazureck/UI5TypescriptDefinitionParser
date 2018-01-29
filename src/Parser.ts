import { IApi, ISymbol } from "./UI5DocumentationTypes";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { ParsedNamespace } from "./generators/entities/ParsedNamespace";
import { EnumGenerator } from "./generators/EnumGenerator";
import { IConfig, ILogDecorator } from "./types";
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

const startTime = Date.now();
Log.activate((message, level) => {
  const curTime = Date.now();
  console.log(curTime - startTime + " - " + message);
});

/**
 *
 *
 * @export
 * @class Parser
 */
export class Parser implements ILogDecorator {
  private config: IConfig;
  private outfolder: string;

  private observedAPIs: {
    [endpoint: string]: {
      loaded: boolean;
      api?: IApi;
    };
  } = {};

  private currentApi: IApi;
  private logger: Log;

  constructor(private configPath: string) {
    this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    // overwrite setting
    this.logger = new Log("Parser", /*this.config.logLevel*/ LogLevel.Trace);
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
          rc
            .get(this.config.connection.root + "/" + endpoint)
            .then(value => received(value, endpoint));
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
      MakeDirRecursiveSync(path.join("apis"));
      for (const sapi in this.observedAPIs) {
        const filename = path.join("apis", sapi.replace(/\//g, "."));
        if (sapi && !fs.existsSync(filename)) {
          const api = this.observedAPIs[sapi];
          fs.writeFileSync(filename, JSON.stringify(api.api), "utf-8");
        }
      }
    }
  }

  private async generate() {
    this.logger.Info("Scanning apis for enums");
    for (const endpoint in this.observedAPIs) {
      if (endpoint) {
        await this.getEnums(this.observedAPIs[endpoint].api);
      }
    }

    this.logger.Info("Scanning apis for namespaces");
    for (const endpoint in this.observedAPIs) {
      if (endpoint) {
        await this.getNamespaces(this.observedAPIs[endpoint].api);
      }
    }

    this.logger.Info("Scanning for interfaces");
    for (const endpoint in this.observedAPIs) {
      if (endpoint) {
        await this.getInterfaces(this.observedAPIs[endpoint].api);
      }
    }

    this.logger.Info("Scanning apis for classes");
    await this.getClassesFromApiJsons();

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

    this.logger.Info("Copying replacement files");
    this.replaceFiles("replacements", this.outfolder);

    // FOrmat all files
    this.logger.Info("*** Formatting output files");
    await this.formatAllFiles();

    this.logger.Info("Replacing Post Processing directives");
    await this.doFilePostProcessingReplacements(this.config);

    // FOrmat all files again, as the user will replace the formatted strings.
    this.logger.Info("*** Formatting output files");
    await this.formatAllFiles();

    this.logger.Info(
      "Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done"
    );
  }

  private async getInterfaces(api: IApi) {}

  private escapeRegExp(str: string): string {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  private async doFilePostProcessingReplacements(
    config: IConfig
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      for (const moduleName in config.postProcessing) {
        try {
          const fullFilePath = path.join(this.outfolder, moduleName + ".d.ts");
          let content = fs.readFileSync(fullFilePath, "utf-8");
          for (const replacer of config.postProcessing[moduleName]) {
            const replaceregex = replacer.isRegex
              ? new RegExp(replacer.searchString, replacer.regexFlags)
              : new RegExp(this.escapeRegExp(replacer.searchString), "g");
            content = content.replace(replaceregex, replacer.replacement);
          }
          fs.writeFileSync(fullFilePath, content);
        } catch (error) {
          this.logger.Error(
            "Error occurred during postprocessing " +
              moduleName +
              ": " +
              JSON.stringify(error)
          );
        }
      }
      resolve();
    });
  }

  private async getClassesFromApiJsons(): Promise<void> {
    let apicount = 0;
    for (const endpoint in this.observedAPIs) {
      apicount++;
    }

    let finishedApiCount = 0;

    const apifinished = (resolve: () => void) => {
      finishedApiCount++;
      if (!(finishedApiCount < apicount)) {
        resolve();
      }
    };
    return new Promise<void>((resolve, reject) => {
      for (const endpoint in this.observedAPIs) {
        if (endpoint) {
          this.getClasses(this.observedAPIs[endpoint].api).then(() =>
            apifinished(resolve)
          );
        }
      }
    });
  }

  private async ParseAllClasses(allClasses: ParsedClass[]): Promise<void> {
    // var bar = new ProgressBar("  Pushing Overloads [:bar] :percent :etas", {
    //   complete: "=",
    //   incomplete: ".",
    //   width: 20,
    //   total: this.allClasses.length
    // });
    return new Promise<void>(async (resolve, reject) => {
      const classcount = allClasses.length;
      let generatedclasses = 0;
      for (const c of allClasses) {
        try {
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
    // bar.tick(1);
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

  private CreateClassOverloads() {
    const baseclasses = this.allClasses.filter(
      (value, index, array) => !value.baseclass
    );
    this.logger.Info("Pushing overloads for classes.");
    console.log();
    for (const bc of baseclasses) {
      bc.pushOverloads();
    }
    console.log("\n");
    this.logger.Info("Overloads done");
  }

  private replaceFiles(sourcePath: string, outPath: string) {
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

  enumTemplate: HandlebarsTemplateDelegate<any> = Handlebars.compile(
    fs.readFileSync("templates/enums.d.ts.hb", "utf-8"),
    {
      noEscape: true
    }
  );

  private async getEnums(api: IApi): Promise<{ generatedEnumCount: number }> {
    this.currentApi = api;
    let info = { generatedEnumCount: 0 };

    // Create out folder if not existing
    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }

    // check if enums folder exists and create it
    if (!fs.existsSync(path.join(this.outfolder, "enums"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "enums"));
    }

    // Get all enums for parsing
    if (api.symbols && api.symbols.length > 0) {
      const enums = api.symbols.filter(x => x.kind === "enum");
      for (const e of enums) {
        this.config.ambientTypes[e.name] = e;
      }

      // Parse enums using the template
      if (enums.length > 0) {
        fs.writeFileSync(
          path.join(this.outfolder, "enums", api.library + ".enums.d.ts"),
          this.enumTemplate(enums),
          { encoding: "utf-8" }
        );
        this.log("Created Enums for '" + api.library + "'");
      }
    }
    return info;
  }

  private allClasses: ParsedClass[] = [];
  private allNamespaces: ParsedNamespace[] = [];

  private async getClasses(
    api: IApi
  ): Promise<{ generatedClassCount: number }> {
    this.currentApi = api;
    let info = { generatedClassCount: 0 };
    const classTemplate = fs.readFileSync(
      "templates/classModule.d.ts.hb",
      "utf8"
    );

    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }
    if (!fs.existsSync(path.join(this.outfolder, "classes"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "classes"));
    }
    if (api.symbols && api.symbols.length > 0) {
      for (const s of api.symbols) {
        switch (s.kind) {
          case "enum":
            break;
          case "class":
            this.allClasses.push(
              new ParsedClass(s, classTemplate, this.config, this)
            );
            // Write to file
            // TODO: Create folder structure
            // fs.writeFileSync(path.join(this.outfolder, "classes", s.name + ".d.ts"), cstring, 'utf-8');
            // this.log("Created Declaration for class '" + s.name + "'");
            info.generatedClassCount++;
            break;
          case "namespace":
            break;
          case "interface":
            break;
          default:
            this.log("New Type discovered: " + s.kind);
        }
      }
    }

    this.log(
      "Created " +
        info.generatedClassCount +
        " classes of Library " +
        api.library
    );
    return info;
  }

  private async getNamespaces(
    api: IApi
  ): Promise<{ generatedNamespaceCount: number }> {
    this.currentApi = api;
    let info = { generatedNamespaceCount: 0 };

    // Check outfolder
    if (!fs.existsSync(this.outfolder)) {
      await MakeDirRecursiveSync(this.outfolder);
    }

    // Create namespace folder
    if (!fs.existsSync(path.join(this.outfolder, "namespaces"))) {
      await MakeDirRecursiveSync(path.join(this.outfolder, "namespaces"));
    }

    // Create static class folder
    if (!fs.existsSync(path.join(this.outfolder, "classes", "static"))) {
      await MakeDirRecursiveSync(
        path.join(this.outfolder, "classes", "static")
      );
    }

    if (api.symbols && api.symbols.length > 0) {
      for (const s of api.symbols) {
        switch (s.kind) {
          case "enum":
            break;
          case "namespace":
            const ns = new ParsedNamespace(s, this.config, this);
            this.config.ambientTypes[s.name] = ns;
            this.allNamespaces.push(ns);
            // Write to file
            // TODO: Create folder structure
            // fs.writeFileSync(path.join(this.outfolder, "classes", s.name + ".d.ts"), cstring, 'utf-8');
            // this.log("Created Declaration for class '" + s.name + "'");
            info.generatedNamespaceCount++;
            break;
          case "class":
            break;
          case "interface":
            break;
          default:
            this.log("New Type discovered: " + s.kind);
        }
      }
    }

    return info;
  }
  log(message: string, sourceStack?: string) {
    if (sourceStack) {
      this.logger.Debug(
        "Library '" +
          this.currentApi.library +
          "' -> " +
          sourceStack +
          ": " +
          message
      );
    } else {
      this.logger.Debug(
        "Library '" + this.currentApi.library + "': " + message
      );
    }
  }

  doPostProductionReplacements(config: IConfig) {
    this.outfolder;
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
