import { IApi } from './UI5DocumentationTypes';
import { ParsedClass } from './generators/entities/ParsedClass';
import { ParsedNamespace } from './generators/entities/ParsedNamespace';
import { EnumGenerator } from './generators/EnumGenerator';
import { IConfig, ILogDecorator } from './types';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as path from 'path';
import { RestClient } from 'typed-rest-client/RestClient';
import * as mkdirp from "mkdirp";

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
        }
    } = {};

    private currentApi: IApi;

    constructor(private configPath: string) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    GenerateDeclarations(outfolder: string): void {
        this.outfolder = outfolder;
        let info = { generatedClasses: 0 };
        if (this.config.connection.root.match(/^file:\/\/\//)) {
            // for (const endpoint of this.config.connection.endpoints) {
            //     const content = fs.readFileSync(path.join(this.config.connection.root.replace(/^file:\/\/\//, ""), endpoint), 'utf-8');
            //     const result = this.getClasses(JSON.parse(content));
            //     info.generatedClasses += result.generatedClassCount;
            // }
        } else {
            const rc = new RestClient("Agent", this.config.connection.root);
            for (const endpoint of this.config.connection.endpoints) {
                this.observedAPIs[endpoint] = {
                    loaded: false
                };
            }
            for (const endpoint of this.config.connection.endpoints) {
                rc.get(this.config.connection.root + "/" + endpoint).then(((value) => {
                    this.receivedAPI(endpoint, value.result);
                }).bind(this));
            }
        }
    }

    private receivedAPI(endpoint: string, api: IApi) {
        this.observedAPIs[endpoint] = {
            loaded: true,
            api: api
        };

        let run = true;
        for (const ep in this.observedAPIs) {
            if (this.observedAPIs[ep].loaded === false) {
                run = false;
                break;
            }
        }
        if (run) {
            this.generate();
        }
    }

    private async generate() {
        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                await this.getEnums(this.observedAPIs[endpoint].api);
            }
        }

        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                await this.getNamespaces(this.observedAPIs[endpoint].api);
            }
        }

        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                await this.getClasses(this.observedAPIs[endpoint].api);
            }
        }

        for (const c of this.allClasses) {
            if (c.extendedClass) {
                const classmodulename = c.extendedClass.replace(/\./g, "/");
                try {
                    c.baseclass = this.allClasses.filter((value, index, array) => value.fullName === classmodulename).pop();
                } catch (error) {
                    console.log("Could not find baseclass for " + c.name);
                }
            }
        }

        this.CreateClassOverloads();

        this.generateSubbedTypeFile("substituted.d.ts");

        for (const c of this.allClasses) {
            const filepath = path.join(this.outfolder, "classes", c.fullName + ".d.ts");
            this.log("Creating class " + filepath);
            try {
                await MakeDirRecursiveSync(path.dirname(filepath));
                try {
                    fs.writeFileSync(filepath, c.toString(), { encoding: 'utf-8' });
                } catch (error) {
                    console.error("Error writing file " + filepath + ": " + error.toString());
                }
            } catch (err) {
                console.error("Error creating folder for file " + filepath + ": " + err.toString());
            }
        }

        for (const ns of this.allNamespaces) {
            const filepath = path.join(this.outfolder, "namespaces", ns.name + ".d.ts");
            this.log("Creating namespace " + filepath);
            try {
                const nsstring = ns.toString();
                if (nsstring) {
                    await MakeDirRecursiveSync(path.dirname(filepath));
                    try {
                        fs.writeFileSync(filepath, ns.toString(), { encoding: "utf-8" });
                    } catch (error) {
                        console.error("Error writing file " + filepath + ": " + error.toString());
                    }
                }

            } catch (error) {
                console.error("Error creating folder for file " + filepath + ": " + error.toString());
            }
        }

        this.replaceFiles("replacements", this.outfolder);

        this.log("Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done Done");
    }

    private CreateClassOverloads() {
        this.log("Pushing overloads for classes.");
        const baseclasses = this.allClasses.filter((value, index, array) => !value.baseclass);
        for (const bc of baseclasses) {
            bc.pushOverloads();
        }
    }

    private replaceFiles(sourcePath: string, outPath: string) {
        ncp.ncp(sourcePath, outPath, (error) => {
            if (error) {
                console.error("Could not copy: " + error.toString());
            }
        });
    }

    private generateSubbedTypeFile(filename: string): void {
        fs.writeFileSync(path.join(this.outfolder, filename), this.getSubstitutedTypes(), { encoding: 'utf-8' });
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
        const enumGen = new EnumGenerator(this.config, this);
        if (!fs.existsSync(this.outfolder)) {
            await MakeDirRecursiveSync(this.outfolder);
        }

        let enums: string[] = [];
        if (!fs.existsSync(path.join(this.outfolder, "enums"))) {
            await MakeDirRecursiveSync(path.join(this.outfolder, "enums"));
        }
        if (api.symbols && api.symbols.length > 0) {
            for (const s of api.symbols) {
                if (s.kind === "enum") {
                    enums.push(enumGen.getEnum(s));
                }
            }
            if (enums.length > 0) {
                fs.writeFileSync(path.join(this.outfolder, "enums", api.library + ".enums.d.ts"), enums.join("\n"), { encoding: 'utf-8' });
                this.log("Created Enums for '" + api.library + "'");
            }
        }
        return info;
    }

    private allClasses: ParsedClass[] = [];
    private allNamespaces: ParsedNamespace[] = [];

    private async getClasses(api: IApi): Promise<{ generatedClassCount: number }> {
        this.currentApi = api;
        let info = { generatedClassCount: 0 };
        const classTemplate = fs.readFileSync("classModule.d.ts", 'utf8');

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
                        this.allClasses.push(new ParsedClass(s, classTemplate, this.config, this));
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

        this.log("Created " + info.generatedClassCount + " classes of Library " + api.library);
        return info;
    }
    private async getNamespaces(api: IApi): Promise<{ generatedNamespaceCount: number }> {
        this.currentApi = api;
        let info = { generatedNamespaceCount: 0 };

        if (!fs.existsSync(this.outfolder)) {
            await MakeDirRecursiveSync(this.outfolder);
        }
        if (!fs.existsSync(path.join(this.outfolder, "namespaces"))) {
            await MakeDirRecursiveSync(path.join(this.outfolder, "namespaces"));
        }

        if (!fs.existsSync(path.join(this.outfolder, "classes", "static"))) {
            await MakeDirRecursiveSync(path.join(this.outfolder, "classes", "static"));
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
            console.log("Library '" + this.currentApi.library + "' -> " + sourceStack + ": " + message);
        } else {
            console.log("Library '" + this.currentApi.library + "': " + message);
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