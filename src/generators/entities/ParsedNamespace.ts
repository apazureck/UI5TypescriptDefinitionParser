import { IConfig, IDictionary, ILogDecorator } from '../../types';
import { ISymbol, IProperty } from '../../UI5DocumentationTypes';
import { GeneratorBase } from '../GeneratorBase';
import { ParsedMethod } from './ParsedMethod';
import { ParsedParameter } from './ParsedParameter'
import { ParsedField } from './ParsedField';

export class ParsedNamespace extends GeneratorBase {
    public methods: ParsedMethod[] = [];
    public fields: ParsedField[] = [];
    constructor(symbol: ISymbol, config: IConfig, private decorated: ILogDecorator, private template: HandlebarsTemplateDelegate) {
        super(config);
        this.symbol = symbol;
        this.createNamespaceMethods(this.symbol);
        this.createFields(this.symbol);
    }

    private createFields(namespace: ISymbol): void {
        if(namespace.properties) {
            const map = namespace.properties.map(prop => new ParsedField(prop as IProperty, this, this.config, this, this.onAddImport.bind(this)));
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
            
            // Create Methods and their overloads
            for (const method of namespace.methods) {
                if (method.visibility === "public") {
                  this.methods = this.methods.concat(
                    ParsedMethod.overloadLeadingOptionalParameters(
                      method,
                      this.onAddImport.bind(this),
                      this,
                      this.config,
                      this
                    )
                  );
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

    private createDescription(description: string): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        return this.makeComment(ret);
    }

    public parse(): string {
        return this.template(this);
    }
    public toString(): string {
        throw new Error("Not implemented!");
    }
}