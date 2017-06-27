import { IConfig, ILogDecorator } from '../types';

export abstract class GeneratorBase implements ILogDecorator {

    protected readonly typeSeparators = /[\.\/]/g;
    protected readonly tsBaseTypes = {
        "any": "any",
        "number": "number",
        "void": "void",
        "string": "string",
        "boolean": "boolean"
    };

    constructor(protected readonly config: IConfig) {

    }
    protected addTabs(input: string, tabsct: number, separator?: string): string {
        const tabs = Array(tabsct + 1).join(separator || "\t");
        return tabs + input.split("\n").join("\n" + tabs);
    }

    protected styleJsDoc(text: string): string {
        // TODO: Remove xml?
        return text;
    }

    protected getType(originType: string): string {
        if (!originType) {
            return "any";
        }
        const unionTypes = originType.split("|");
        let ret: string[] = [];
        for (let type of unionTypes) {
            let isArray = false;
            if (type.match(/\[\]$/)) {
                isArray = true;
                type = type.replace(/\[\]$/, "");
            }

            if (this.config.typeMap.hasOwnProperty(type)) {
                const oldtype = type;

                // Check if class is namespaced
                if(!type.match(/\./)) {
                    type = this.config.typeMap[type];
                    ret.push(type);
                    this.log("Replaced: Type '" + oldtype + "' => Type '" + type + "'");
                    continue;
                }
            }

            if (this.tsBaseTypes.hasOwnProperty(type)) {
                ret.push(isArray ? this.tsBaseTypes[type] + "[]" : this.tsBaseTypes[type]);
                continue;
            }

            if(this.config.enums.hasOwnProperty(type)) {
                ret.push(isArray ? type + "[]" : type);
                continue;
            }

            if(this.config.substitutedTypes.hasOwnProperty(type)) {
                ret.push(isArray ? type + "[]" : type);
                continue;
            }

            this.addImport(type);
            ret.push(isArray ? type.split(this.typeSeparators).pop() + "[]" : type.split(this.typeSeparators).pop());
        }
        return ret.join("|");
    }

    /**
     * Calls the onAddImport Callback
     * 
     * @protected
     * @param {string} module Module to import from
     * @param {string} [type] type to import
     * 
     * @memberof GeneratorBase
     */
    protected addImport(module: string, type?: string) {
        if (this.onAddImport) {
            this.onAddImport(module, type);
        }
    }

    protected onAddImport: (module: string, type?:string) => void;

    protected makeComment(description: string): string {
        if(!description) {
            return "";
        }
        let ret = "/**\n";
        for (const line of description.split("\n")) {
            ret += " * " + line + "\n";
        }
        return ret + "**/";
    }

    abstract log(message: string, sourceStack?: string);
}