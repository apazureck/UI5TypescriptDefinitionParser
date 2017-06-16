import { MethodGenerator } from './MethodGenerator';
import { EventGenerator } from './EventGenerator';
import { GeneratorBase } from './GeneratorBase';
import { ADDRGETNETWORKPARAMS } from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import { Config, Method, Parameter, ReturnValue, Symbol } from './types';
import * as types from './types';

interface Dictionary {
    [key: string]: string;
}
export class ClassGenerator extends GeneratorBase {
    
    private imports: Dictionary;
    /**
     *
     */
    constructor(private classTemplate: string, private outfolder: string, config: Config) {
        super(config)
    }

    createClass(sClass: Symbol): string {
        this.imports = {};
        let ct = this.classTemplate.toString();
        // 1. Set Module Name
        ct = ct.replace("classModule", sClass.module);
        // 2. Set Class Name
        ct = ct.replace("className", sClass.basename);
        // 3. Set extends
        if (sClass.extends) {
            ct = ct.replace("/*$$extends$$*/", "extends " + sClass.extends.split(".").pop());
            this.addImport(sClass.extends)
        }
        // 3. Paste description
        ct = ct.replace("/*$$description$$*/", this.createDescription(sClass.description));

        // 4. Create Events
        if (sClass.events) {
            const ec = new EventGenerator(this.config, this.addImport.bind(this));
            ct = ct.replace("/*$$events$$*/", this.addTabs(sClass.events.map((value, index, array) => {
                return ec.createEventString(value).method;
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$events$$*/", "");
        }

        // 5. Create methods
        if (sClass.methods) {
            const mc = new MethodGenerator(this.config, this.addImport.bind(this));
            ct = ct.replace("/*$$methods$$*/", this.addTabs(sClass.methods.map((value, index, array) => {
                return mc.createMethodString(value).method;
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$methods$$*/", "");
        }

        // 6. Create Constructor
        if(sClass.constructor) {
            sClass.constructor.name = "constructor";
            sClass.constructor.visibility = "public";
            const mc = new MethodGenerator(this.config, this.addImport.bind(this));
            let ctors = mc.createMethodString(sClass.constructor).method;
            if(sClass.constructor.parameters && sClass.constructor.parameters[0].name === "sId" && sClass.constructor.parameters[0].optional === true) {
                let noIdCtor = sClass.constructor;
                noIdCtor.parameters.shift();
                ctors += "\n" + mc.createMethodString(sClass.constructor).method;
            }
            ct = ct.replace("/*$$ctors$$*/", this.addTabs(ctors, 2));
        } else {
            ct = ct.replace("/*$$ctors$$*/", "");
        }

        // Replace Imports
        if (this.imports[sClass.basename]) {
            delete this.imports[sClass.basename];
        }
        ct = ct.replace("/*$$imports$$*/", this.addTabs(this.importsToString(), 1));
        return ct;
    }

    private createDescription(description: string): string {

        let ret = "/**\n";

        if (description) {
            description = this.styleJsDoc(description);
            description = this.makeComment(description);
        }

        return description;
    }

    /**
     * Adds a new type to the import list
     * 
     * @private
     * @param {string} fullTypeName full Type name as namespace syntax or module syntax
     * 
     * @memberof ClassGenerator
     */
    onAddImport = (fullTypeName: string) => {
        const typename = fullTypeName.split(this.typeSeparators).pop();
        if (!this.imports[typename]) {
            this.imports[typename] = `import { ${typename} } from '${fullTypeName.replace(/\./g, "/")}'`;
        }
    }

    private importsToString(): string {
        let ret = "";
        for (const i in this.imports) {
            if (this.imports.hasOwnProperty(i)) {
                ret += this.imports[i] + '\n';
            }
        }
        return ret;
    }
}