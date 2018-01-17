import { GeneratorBase } from './GeneratorBase';
import { ISymbol } from '../UI5DocumentationTypes';
import { IConfig, ILogDecorator } from '../types';

export class EnumGenerator extends GeneratorBase {

    private currentEnum: string;
    constructor(config: IConfig, private decorated: ILogDecorator, private template: string) {
        super(config);
    }

    getEnum(symbol: ISymbol): string {
        let ret = "";
        let enumpath = symbol.name.split(".");
        this.currentEnum = enumpath.pop();

        const enumns = enumpath.join(".");
        ret += "declare namespace " + enumns + "{\n";

        // Create enum typedef
        let enumtypedef = "export type " + this.currentEnum + " = ";
        if (symbol.properties) {
            const types = symbol.properties.map((value, index, array) => {
                return "\"" + (value as any).name + "\"";
            });
            enumtypedef += types.join(" | ") + ";\n";
        } else {
            this.log("Error in Documentation. No properties for enum '" + symbol.name+ "'");
            enumtypedef += "any";
        }
        
        ret += this.getDescription(symbol.description)
        ret += this.addTabs(enumtypedef, 1);
        this.config.enums[symbol.name] = "";
        return ret + "}";
    }

    private getDescription(description: string): string {
        description = this.styleJsDoc(description);
        return this.makeComment(description);
    }

    log(message: string, sourceStack?: string) {
        if(sourceStack) {
            this.decorated.log("Enum '" + this.currentEnum + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Enum '" + this.currentEnum + "'", message);
        }
    }
}