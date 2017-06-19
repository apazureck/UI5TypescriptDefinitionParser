import { GeneratorBase } from './GeneratorBase';
import { MethodGenerator } from './MethodGenerator';
import { IConfig, IDictionary, ILogDecorator } from '../types';
import { IApi, IMethod, IParameter, IReturnValue, ISymbol } from '../UI5DocumentationTypes';
import { ClassGenerator } from './ClassGenerator';

export class NamespaceGenerator extends GeneratorBase {
    private currentNamespace: ISymbol;
    private imports: IDictionary;
    constructor(config: IConfig, private decorated: ILogDecorator, private classTemplate: string) {
        super(config);
    }

    createNamespaces(api: IApi): { namespace: string, staticClasses: { name: string, content: string }[] } {
        this.imports = {};
        let nscontent = "";
        let staticClasses: { name: string, content: string }[] = [];
        for (const s of api.symbols) {
            if (s.kind === "namespace") {
                const nsout = this.createNamespace(s);
                if(nsout.isStaticClass){
                    staticClasses = staticClasses.concat({ content: nsout.content, name: s.name });
                } else {
                    nscontent += "\n" + nsout.content;
                } 
            }
        }

        let imports = "";
        for (let importkey in this.imports) {
            if (importkey) {
                imports += this.imports[importkey] + "\n";
            }
        }

        return { namespace: imports + "\n" + nscontent, staticClasses: staticClasses };
    }

    private createNamespace(namespace: ISymbol): { content: string, isStaticClass?: boolean } {
        this.currentNamespace = namespace;


        let methods: { method: string, description: string }[] = [];
        

        if (namespace.methods) {
            // If methods are static it is a static class
            if (namespace.methods[0].static) {
                let cg = new ClassGenerator(this.classTemplate, this.config, this);
                return { content: cg.createClass(namespace), isStaticClass: true };
            }
            let mg = new MethodGenerator(this.config, this.addImport.bind(this), this);
            for (const method of namespace.methods) {
                if (method.visibility === "public") {
                    methods = methods.concat(mg.createMethodStubs(method));
                }
            }
            for (const method of methods) {
                method.method = "export function " + method.method;
            }
        }
        
        if (methods.length > 0) {
            let nscontent = "";
            nscontent += "declare namespace " + namespace.name + " {\n";
            return { content: nscontent + this.addTabs(methods.map((value, index, array) => value.description + "\n" + value.method).join("\n"), 1) + "\n}" };
        } else {
            return { content: "" };
        }
    }
    private createDescription(description: string): string {
        let ret = "";
        if (description) {
            ret = this.styleJsDoc(description) + "\n";
        }

        return this.makeComment(ret);
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Namespace '" + this.currentNamespace.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Namespace '" + this.currentNamespace.name + "': ", message);
        }
    }

    onAddImport = (fullTypeName: string) => {
        const typename = fullTypeName.split(this.typeSeparators).pop();
        if (!this.imports[typename]) {
            this.imports[typename] = `import { ${typename} } from '${fullTypeName.replace(/\./g, "/")}'`;
        }
    }
}