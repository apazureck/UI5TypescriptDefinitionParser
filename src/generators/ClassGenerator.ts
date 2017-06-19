import { MethodGenerator } from './MethodGenerator';
import { EventGenerator } from './EventGenerator';
import { GeneratorBase } from './GeneratorBase';
import * as fs from 'fs';
import * as path from 'path';
import { IMethod, IParameter, IReturnValue, ISymbol, IEvent } from '../UI5DocumentationTypes';
import { IConfig, IDictionary, ILogDecorator } from '../types';

export class ClassGenerator extends GeneratorBase {

    private imports: IDictionary;

    private currentClass: ISymbol;
    /**
     *
     */
    constructor(private classTemplate: string, config: IConfig, private decorated: ILogDecorator) {
        super(config);
    }

    createClass(sClass: ISymbol): string {
        this.currentClass = sClass;
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
        } else {
            ct = ct.replace("/*$$extends$$*/", "");
        }
        // 3. Paste description
        ct = ct.replace("/*$$description$$*/", this.createDescription(sClass.description));

        // 4. Create Events
        if (sClass.events) {
            const ec = new EventGenerator(this.config, this.addImport.bind(this), this);
            ct = ct.replace("/*$$events$$*/", this.addTabs(sClass.events.map((value, index, array) => {
                return ec.createEventString(value, sClass.basename).method;
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$events$$*/", "");
        }

        // 5. Create methods
        if (sClass.methods) {
            const mc = new MethodGenerator(this.config, this.addImport.bind(this), this);
            ct = ct.replace("/*$$methods$$*/", this.addTabs(sClass.methods.map((value, index, array) => {
                return mc.createMethodString(value);
            }).join("\n"), 2));
        } else {
            ct = ct.replace("/*$$methods$$*/", "");
        }

        // 6. Create Constructor
        try {
            if (sClass.constructor) {
                sClass.constructor.name = "constructor";
                sClass.constructor.visibility = "public";
                const mc = new MethodGenerator(this.config, this.addImport.bind(this), this);
                let ctors = mc.createMethodString(sClass.constructor, true);
                if (sClass.constructor.parameters && sClass.constructor.parameters[0].name === "sId" && sClass.constructor.parameters[0].optional === true) {
                    let noIdCtor = sClass.constructor;
                    noIdCtor.parameters.shift();
                    ctors += "\n" + mc.createMethodString(sClass.constructor, true);
                }
                ct = ct.replace("/*$$ctors$$*/", this.addTabs(ctors, 2));
            } else {
                ct = ct.replace("/*$$ctors$$*/", "");
            }
        } catch (error) {
            // Caught, as always a constructor is given.
            ct = ct.replace("/*$$ctors$$*/", "");
        }

        // Create Property Interface

        ct = ct.replace("/*$$propertyInterface$$*/", this.createMetadataInterface(sClass));


        // Replace Imports
        if (this.imports[sClass.basename]) {
            delete this.imports[sClass.basename];
        }
        ct = ct.replace("/*$$imports$$*/", this.addTabs(this.importsToString(), 1));
        return ct;
    }

    private createMetadataInterface(sClass: ISymbol): string {
        let ret = "export interface I" + sClass.basename + "Metadata";

        if (sClass.extends) {
            const exmeta = "I" + sClass.extends.split(this.typeSeparators).pop() + "Metadata";
            ret += " extends " + exmeta;
            this.imports[exmeta] = `import { ${exmeta} } from '${sClass.extends.replace(/\./g, "/")}'`;
        }

        ret += " {\n";

        let props: string[] = [];

        if (sClass["ui5-metadata"]) {
            if (sClass["ui5-metadata"].properties) {
                for (const prop of sClass["ui5-metadata"].properties) {
                    let pstring: string = prop.name;
                    pstring += "?: ";
                    pstring += this.getType(prop.type);
                    pstring += ";";
                    props.push(pstring);
                }
            }
        }

        ret += this.addTabs(props.join("\n"), 1);

        return ret + "\n}";
    }

    private createDescription(description: string): string {
        if (!description) {
            return "";
        }
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
        if (!fullTypeName) {
            return;
        }
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

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Class '" + this.currentClass.basename + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Class '" + this.currentClass.basename + "'", message);
        }
    }
}