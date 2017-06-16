import { ILogDecorator } from './GeneratorBase';
import { Api, Config } from './UI5DocumentationTypes';
import { ClassGenerator } from './ClassGenerator';
import { EnumGenerator } from './EnumGenerator';
import { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import { RestClient } from 'typed-rest-client/RestClient';

/**
 * 
 * 
 * @export
 * @class Parser
 */
export class Parser implements ILogDecorator {

    private config: Config;
    private outfolder: string;

    private observedAPIs: {
        [endpoint: string]: {
            loaded: boolean;
            api?: Api;
        }
    } = {};

    private currentApi: Api;

    constructor(private configPath: string) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    GenerateDeclarations(outfolder: string): void {
        this.outfolder = outfolder;
        let info = { generatedClasses: 0 }
        if (this.config.connection.root.match(/^file:\/\/\//)) {
            for (const endpoint of this.config.connection.endpoints) {
                const content = fs.readFileSync(path.join(this.config.connection.root.replace(/^file:\/\/\//, ""), endpoint), 'utf-8');
                const result = this.getClasses(JSON.parse(content));
                info.generatedClasses += result.generatedClassCount;
            }
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

    private receivedAPI(endpoint: string, api: Api) {
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

        for(const endpoint in this.observedAPIs) {
            if(endpoint) {
                this.getClasses(this.observedAPIs[endpoint].api);
            }
        }
    }

    private getEnums(api: Api) {
        this.currentApi = api;
        let info = { generatedEnumCount: 0 }
        const enumGen = new EnumGenerator(this.config);
        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }

        let enums: string[] = [];
        if (api.symbols && api.symbols.length > 0) {
            for (const s of api.symbols) {
                if (s.kind === "enum") {
                    enums.push(enumGen.getEnum(s));
                }
            }
            if (enums.length > 0) {
                fs.writeFileSync(path.join(this.outfolder, api.library + "enums..d.ts"), enums.join("\n"), 'utf-8');
                this.log("Created Enums for '" + api.library + "'");
            }
        }
    }

    private getClasses(api: Api): { generatedClassCount: number } {
        this.currentApi = api;
        let info = { generatedClassCount: 0 }
        const classgen = new ClassGenerator(fs.readFileSync("classModule.d.ts", 'utf8'), this.outfolder, this.config, this);
        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }
        if (api.symbols && api.symbols.length > 0) {
            for (const s of api.symbols) {
                switch (s.kind) {
                    case "enum":
                        break;
                    case "class":
                        const cstring = classgen.createClass(s);
                        // Write to file
                        // TODO: Create folder structure
                        fs.writeFileSync(path.join(this.outfolder, s.name + ".d.ts"), cstring, 'utf-8');
                        this.log("Created Declaration for class '" + s.name + "'");
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

    log(message: string, sourceStack?: string) {
        
        if(sourceStack) {
            console.log("Library '" + this.currentApi.library + "' -> " + sourceStack + ": " + message);
        } else {
            console.log("Library '" + this.currentApi.library + "': " + message);
        }
    }
}