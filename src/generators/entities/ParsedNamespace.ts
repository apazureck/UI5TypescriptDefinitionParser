import { IConfig, IDictionary, ILogDecorator } from '../../types';
import { ISymbol, IProperty } from '../../UI5DocumentationTypes';
import { GeneratorBase } from '../GeneratorBase';
import { ParsedMethod } from './ParsedMethod';
import { ParsedParameter } from './ParsedParameter'
import { ParsedField } from './ParsedField';

export class ParsedNamespace extends GeneratorBase {
    private imports: IDictionary = {};
    public get name(): string {
        return this.documentNamespace.name;
    };

    public methods: ParsedMethod[] = [];
    public fields: ParsedField[] = [];
    constructor(private documentNamespace: ISymbol, config: IConfig, private decorated: ILogDecorator) {
        super(config);
        this.createNamespaceMethods(this.documentNamespace);
        this.createFields(this.documentNamespace);
    }

    private createFields(namespace: ISymbol): void {
        if(namespace.properties) {
            const map = namespace.properties.map(prop => new ParsedField(prop as IProperty, this, this.config, this));
            if(map && map.length > 0) {
                this.fields = map;
            }
        }
    }

    private createNamespaceMethods(namespace: ISymbol): void {
        // let methods: { method: string, description: string }[] = [];

        if (namespace.methods) {
            // If methods are static it is a static class
            if (namespace.methods[0].static) {
                // let cg = new ClassGenerator(this.classTemplate, this.config, this);
                // return { content: cg.createClass(namespace), isStaticClass: true };
            }
            // let mg = new MethodGenerator(this.config, this.addImport.bind(this), this);
            for (const method of namespace.methods) {
                if (method.visibility === "public") {
                    this.methods.push(new ParsedMethod(method, this.onAddImport.bind(this), this, this.config, this));
                }
            }
        }
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Namespace '" + this.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Namespace '" + this.name + "': ", message);
        }
    }

    onAddImport = (fullTypeName: string) => {
        const typename = fullTypeName.split(this.typeSeparators).pop();
        if (!this.imports[typename]) {
            this.imports[typename] = `import { ${typename} } from '${fullTypeName.replace(/\./g, "/")}'`;
        }
    }

    private createDescription(description: string): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        return this.makeComment(ret);
    }

    public toString(): string {
        if (this.methods.length > 0) {
            let nscontent = "";
            nscontent += "declare namespace " + this.name + " {\n";
            for(const method of this.methods) {
                nscontent += this.addTabs(this.makeComment(method.description), 1) + "\n";
                nscontent += this.addTabs("export function" + method.toString(true), 1) + "\n";
            }
            nscontent += "}\n";
            return nscontent;
        } else {
            return undefined;
        }
    }
}