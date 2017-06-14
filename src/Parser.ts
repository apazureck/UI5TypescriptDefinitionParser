import { Api, Config } from './types';
import { ClassGenerator } from './ClassGenerator';
import * as fs from 'fs';
import { RestClient } from 'typed-rest-client/RestClient';
import * as path from 'path';

/**
 * 
 * 
 * @export
 * @class Parser
 */
export class Parser {

    private config: Config;
    private outfolder: string;
    constructor(private configPath: string) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    GenerateDeclarations(outfolder: string): void {
        this.outfolder = outfolder;
        if (this.config.connection.root.match(/^file:\/\/\//)) {
            for(const endpoint of this.config.connection.endpoints) {
                const content = fs.readFileSync(path.join(this.config.connection.root.replace(/^file:\/\/\//, ""), endpoint), 'utf-8');
                this.getModules(JSON.parse(content));
            }
        } else {
            const rc = new RestClient("Agent", this.config.connection.root);

            for (const endpoint of this.config.connection.endpoints) {
                rc.get(this.config.connection.root + "/" + endpoint).then(((value) => {
                    this.getModules(value.result);
                }).bind(this));
            }
        }
    }

    private getModules(api: Api) {
        const classgen = new ClassGenerator(fs.readFileSync("classModule.d.ts", 'utf8'), this.outfolder, this.config);
        if (!fs.existsSync(this.outfolder)) {
            fs.mkdirSync(this.outfolder);
        }

        for (const s of api.symbols) {
            switch (s.kind) {
                case "enum":
                    break;
                case "class":
                    const cstring = classgen.createClass(s);
                    console.log("Created Declaration for class '" + s.name + "'");
                    // Write to file
                    // TODO: Create folder structure
                    fs.writeFileSync(path.join(this.outfolder, s.name + ".d.ts"), cstring, 'utf-8');
                    break;
                case "namespace":
                    break;
                case "interface":
                    break;
                default:
                    console.log("New Type discovered: " + s.kind);
            }
        }
    }
}