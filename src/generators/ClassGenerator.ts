import { MethodGenerator } from './MethodGenerator';
import { EventGenerator } from './EventGenerator';
import { GeneratorBase } from './GeneratorBase';
import * as fs from 'fs';
import * as path from 'path';
import { IMethod, IParameter, IReturnValue, ISymbol, IEvent } from '../UI5DocumentationTypes';
import { IConfig, IDictionary, ILogDecorator } from '../types';
import { ParsedClass } from "./entities/ParsedClass";

export class ClassGenerator extends GeneratorBase {

    private imports: IDictionary;

    private currentClass: ISymbol;
    /**
     *
     */
    constructor(private classTemplate: string, config: IConfig, private decorated: ILogDecorator) {
        super(config);
    }

    createClass(sClass: ISymbol): ParsedClass {
        
    }

    private createSettingsInterface(sClass: ISymbol): string {
        let ret = "export interface I" + sClass.basename + "Settings";

        if (sClass.extends) {
            const exmeta = "I" + sClass.extends.split(this.typeSeparators).pop() + "Settings";
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

    

    /**
     * Adds a new type to the import list
     * 
     * @private
     * @param {string} fullTypeName full Type name as namespace syntax or module syntax
     * 
     * @memberof ClassGenerator
     */
    

    

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("ClassGenerator -> " + sourceStack, message);
        } else {
            this.decorated.log("ClassGenerator: ", message);
        }
    }
}