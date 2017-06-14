import * as fs from 'fs';
import { RestClient } from 'typed-rest-client/RestClient';
import * as path from 'path';

export interface Config {
    connection: {
        root: string;
        endpoints: string[];
    }
}

export interface Api {
    version: string;
    library: string;
    symbols: Symbol[];
}

export type Kind = "namespace" | "class" | "enum";
export type Visibility = "public" | "protected" | "private"

export interface Symbol {
    kind: Kind;
    name: string;
    basename: string;
    resource: string;
    module: string;
    export: string;
    static: boolean;
    visibility: Visibility;
    description: string;
    extends?: string;
    ui5metadata?: {};
    "constructor"?: {};
    properties?: {}[];
    methods?: {}[];
}

export class Parser {

    private config: Config;
    private outfolder: string;

    constructor(private configPath: string) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    GenerateDeclarations(outfolder: string): Promise<any> {
        this.outfolder = outfolder;
        const rc = new RestClient("Agent", this.config.connection.root);

        return rc.get(this.config.connection.root + "/" + this.config.connection.endpoints[0]).then(((value) => {
            let test = value.result;
            this.getModules(value.result);
        }).bind(this));
    }

    private getModules(api: Api) {
        const classTemplate = fs.readFileSync("classModule.d.ts", 'utf8');
        if(!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }
        
        for(const s of api.symbols) {
            switch(s.kind) {
                case "enum":
                break;
                case "class":
                    let ct = classTemplate.toString();
                    ct = ct.replace("classModule", s.module);
                    ct = ct.replace("className", s.basename);
                    fs.writeFileSync(path.join(this.outfolder, s.name+".d.ts"), ct, 'utf-8');
                break;
                case "namespace":
                break;
                default:
                console.log("New Type discovered: " + s.kind);
            }
        }
    }
}