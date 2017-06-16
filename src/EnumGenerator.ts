import { GeneratorBase } from './GeneratorBase';
import { Config, Symbol } from './types';

export class EnumGenerator extends GeneratorBase {
    constructor(config: Config) {
        super(config);
    }

    getEnum(symbol: Symbol): string {
        let ret = "";
        let enumpath = symbol.name.split(".");
        const enumname = enumpath.pop();
        const enumns = enumpath.join(".");
        ret += "declare namespace " + enumns + "{\n";

        // Create enum typedef
        let enumtypedef = "export type " + enumname + " = ";
        if (symbol.properties) {
            const types = symbol.properties.map((value, index, array) => {
                return (value as any).name as string;
            });
            enumtypedef += types.join(" | ") + ";\n";
        } else {
            console.error("Error in Documentation. No properties for enum '" + symbol.name+ "'");
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
}