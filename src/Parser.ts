import { IApi } from './UI5DocumentationTypes';
import { ParsedClass } from './generators/entities/ParsedClass';
import { EnumGenerator } from './generators/EnumGenerator';
import { NamespaceGenerator } from './generators/NamespaceGenerator';
import { IConfig, ILogDecorator } from './types';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as path from 'path';
import { RestClient } from 'typed-rest-client/RestClient';

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
        let info = { generatedClasses: 0 }
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
        }

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

    private generate() {
        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                this.getEnums(this.observedAPIs[endpoint].api);
            }
        }

        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                this.getNamespaces(this.observedAPIs[endpoint].api);
            }
        }

        for (const endpoint in this.observedAPIs) {
            if (endpoint) {
                this.getClasses(this.observedAPIs[endpoint].api);
            }
        }

        this.generateSubbedTypeFile("substituted.d.ts");

        this.replaceFiles("replacements", this.outfolder);
    }

    private replaceFiles(sourcePath: string, outPath: string) {
        ncp.ncp(sourcePath, outPath, (error) => {
            if(error){
                console.error("Could not copy: " + error.toString());
            }
        });
    }

    private generateSubbedTypeFile(filename: string): void {
        fs.writeFileSync(path.join(this.outfolder, filename), this.getSubstitutedTypes(), 'utf-8');
    }

    private getSubstitutedTypes(): string {
        let types: string[] = [];
        for(const tkey in this.config.substitutedTypes) {
            if(tkey) {
                types.push(this.config.substitutedTypes[tkey]);
            }
        }
        return types.join("\n");
    }

    private getEnums(api: IApi): { generatedEnumCount: number } {
        this.currentApi = api;
        let info = { generatedEnumCount: 0 }
        const enumGen = new EnumGenerator(this.config, this);
        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }

        let enums: string[] = [];
        if (!fs.existsSync(path.join(this.outfolder, "enums"))) {
            fs.mkdirSync(path.join(this.outfolder, "enums"));
        }
        if (api.symbols && api.symbols.length > 0) {
            for (const s of api.symbols) {
                if (s.kind === "enum") {
                    enums.push(enumGen.getEnum(s));
                }
            }
            if (enums.length > 0) {
                fs.writeFileSync(path.join(this.outfolder, "enums", api.library + ".enums.d.ts"), enums.join("\n"), 'utf-8');
                this.log("Created Enums for '" + api.library + "'");
            }
        }
        return info;
    }

    private allClasses: ParsedClass[] = [];

    private getClasses(api: IApi): { generatedClassCount: number } {
        this.currentApi = api;
        let info = { generatedClassCount: 0 }
        const classTemplate = fs.readFileSync("classModule.d.ts", 'utf8');

        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }
        if (!fs.existsSync(path.join(this.outfolder, "classes"))) {
            fs.mkdirSync(path.join(this.outfolder, "classes"));
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
    private getNamespaces(api: IApi): { generatedNamespaceCount: number } {
        this.currentApi = api;
        let info = { generatedNamespaceCount: 0 }
        const namespaceGen = new NamespaceGenerator(this.config, this, fs.readFileSync("classModule.d.ts", 'utf8'));
        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }
        if (!fs.existsSync(path.join(this.outfolder, "namespaces"))) {
            fs.mkdirSync(path.join(this.outfolder, "namespaces"));
        }

        if (!fs.existsSync(path.join(this.outfolder, "classes", "static"))) {
            fs.mkdirSync(path.join(this.outfolder, "classes", "static"));
        }

        if (api.symbols && api.symbols.length > 0) {
            const filepath = path.join(this.outfolder, "namespaces", api.library + ".d.ts");
            const ns = namespaceGen.createNamespaces(api);
            fs.writeFileSync(filepath, ns.namespace, { encoding: 'utf-8' });
            for(let staticClass of ns.staticClasses) {
                fs.writeFileSync(path.join(this.outfolder, "classes", "static", staticClass.name + ".d.ts"), staticClass.content, {encoding: 'utf-8'});
            }
            this.log("Created namespaces for '" + api.library + "'");
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