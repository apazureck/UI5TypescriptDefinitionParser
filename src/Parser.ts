import { IApi, ISymbol } from "./UI5DocumentationTypes";
import { ParsedClass } from "./generators/entities/ParsedClass";
import { ParsedNamespace } from "./generators/entities/ParsedNamespace";
import { EnumGenerator } from "./generators/EnumGenerator";
import { IConfig, ILogDecorator } from "./types";
import * as fs from "fs";
import * as ncp from "ncp";
import * as path from "path";
import { RestClient } from "typed-rest-client/RestClient";
import * as mkdirp from "mkdirp";
import * as Handlebars from "handlebars";
import * as hbex from "./handlebarsExtensions";
hbex.registerHelpers(Handlebars);
import * as gulp from "gulp";
import * as gulptsf from "gulp-typescript-formatter";
import * as ts from "typescript";
import { Log, LogLevel } from "./log";
import * as ProgressBar from "progress";

Log.activate((message, level) => {
  const curTime = new Date();
  console.log(
    curTime.getMinutes() +
      ":" +
      curTime.getSeconds() +
      ":" +
      curTime.getMilliseconds() +
      " - " +
      message
  );
});

declare interface RootOptions {
  replace: boolean;
  verify: boolean;
  baseDir: string[];
  stdin: boolean;
  tsconfig: boolean;
  tslint: boolean;
  editorconfig: boolean;
  vscode: boolean;
  tsfmt: boolean;
  useTsconfig: string[];
  useTslint: string[];
  useTsfmt: string[];
  useVscode: string[];
  verbose: boolean;
  version: boolean;
}
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
    this.logger = new Log("Parser", /*this.config.logLevel*/ LogLevel.Info);
    this.logger.Trace("Started Logger");
  }
  GenerateDeclarations(outfolder: string): void {
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

    // Request all not cached/loaded enpoints
    for (const endpoint of this.config.connection.endpoints) {
      if (!this.observedAPIs[endpoint].loaded) {
        this.logger.Info("Loading endpoint '" + endpoint + "'");
        rc.get(this.config.connection.root + "/" + endpoint).then(
          (value => {
            this.receivedAPI(endpoint, value.result);
          }).bind(this)
        );
      }
    }

    // Wait for apis to come in
    let wait = true;
    this.logger.Info("Waiting for apis to come in");
    while (wait) {
      let run = true;
      for (const ep in this.observedAPIs) {
        if (this.observedAPIs[ep].loaded === false) {
          run = false;
          break;
        }
      }

      // if all observed apis are loaded create
      if (run) {
        this.logger.Info("Received all apis");
        this.generate();
        wait = false;
      }
    }
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

    this.logger.Info("Scanning apis for classes");
    for (const endpoint in this.observedAPIs) {
      if (endpoint) {
        await this.getClasses(this.observedAPIs[endpoint].api);
      }
    }

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
    var bar = new ProgressBar("  Pushing Overloads [:bar] :percent :etas", {
      complete: "=",
      incomplete: ".",
      width: 20,
      total: this.allClasses.length
    });
    for (const c of this.allClasses) {
      bar.tick(1);
      const filepath = path.join(
        this.outfolder,
        "classes",
        c.fullName + ".d.ts"
      );
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

    this.logger.Info("Creating Namespace files");
    // Make namespace files
    const nstemplate = Handlebars.compile(
      fs.readFileSync("templates/namespace.d.ts.hb", "utf-8")
    );
    for (const ns of this.allNamespaces) {
      const filepath = path.join(
        this.outfolder,
        "namespaces",
        ns.name + ".d.ts"
      );
      this.log("Creating namespace " + filepath);
      try {
        const nsstring = ns.toString();
        if (nsstring) {
          await MakeDirRecursiveSync(path.dirname(filepath));
          try {
            fs.writeFileSync(filepath, nstemplate(ns), { encoding: "utf-8" });
          } catch (error) {
            console.error(
              "Error writing file " + filepath + ": " + error.toString()
            );
          }
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

    this.logger.Info(
      "Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done"
    );
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
    var bar = new ProgressBar("  Pushing Overloads [:bar] :percent :etas", {
      complete: "=",
      incomplete: ".",
      width: 20,
      total: baseclasses.length
    });
    for (const bc of baseclasses) {
      bar.tick(1);
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
  private async getEnums(api: IApi): Promise<{ generatedEnumCount: number }> {
    this.currentApi = api;
    let info = { generatedEnumCount: 0 };

    // Get Template for enums
    const enumTemplate = Handlebars.compile(
      fs.readFileSync("templates/enums.d.ts.hb", "utf-8")
    );

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

      // Parse enums using the template
      if (enums.length > 0) {
        fs.writeFileSync(
          path.join(this.outfolder, "enums", api.library + ".enums.d.ts"),
          enumTemplate(enums),
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
            this.allNamespaces.push(new ParsedNamespace(s, this.config, this));
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
