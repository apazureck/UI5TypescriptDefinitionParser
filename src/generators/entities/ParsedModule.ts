import { ParsedBase } from "../ParsedBase";
import { IConfig, ILogDecorator, IType } from "../../types";
import { ISymbol } from "../../UI5DocumentationTypes";
import { ParsedClass } from "./ParsedClass";
import { ParsedNamespace } from "./ParsedNamespace";

export class ParsedModule extends ParsedBase {

    excludedFromBaseNamespace: ParsedBase[];
    configureExport(): any {
        if (this.moduleContent.length > 1) {
            const potentialNamespace = this.moduleContent[0];
            if (potentialNamespace instanceof ParsedNamespace) {
                // A empty namespace is set as default namespace
                // this.baseNamespace = potentialNamespace.basename;
                // this.excludedFromBaseNamespace = [this.moduleContent.shift()];
                return;
            } else if (potentialNamespace instanceof ParsedClass) {
                // Rest of the exports overloads with baseclass
                // this.baseNamespace = potentialNamespace.basename;
                // this.excludedFromBaseNamespace = [this.moduleContent.shift()];
            }
        }
    }
    get typings(): string {
        this.getImports(this.moduleContent);
        this.configureExport();
        try {
            return this.template(this);
        } catch (error) {
            this.logger.Error("Handlebars error: " + error.message + "\n" + error.stack);
            throw error;
        }

    }

    constructor(name: string, config: IConfig, public moduleContent: ParsedBase[], private decorated: ILogDecorator, private template: HandlebarsTemplateDelegate, public isGlobal: boolean) {
        super(config);
        this.symbol = {
            basename: name.split(/\//g).pop(),
            description: "Module",
            export: name.split(/\//g).pop(),
            kind: "module",
            module: name,
            name: name,
            resource: name,
            static: true,
            visibility: "public"
        } as any;
    }

    private importedNamespaces: { [name: string]: boolean } = {};

    public baseNamespace: string;

    getImports(content: ParsedBase[]) {
        const allimports: IType[] = [];
        // Add all imports to allimports
        content.forEach(x => (x.Imports || []).forEach(imp => allimports.push(imp)));

        for (const imp of allimports) {

            // Check if basename is equal to the export name
            // const namespacedExportArray = imp.type.export.split(".");
            if(imp.type.module === this.name) {
                continue;
            }
            if(imp.type.export === "") {
                imp.isDefaultExport = true;
            } else if (imp.type.basename.split(".").length > 1) {
                const nsimport = imp.type.basename.split(".").shift();

                if (!this.importedNamespaces[nsimport]) {
                    this.imports[nsimport] = {
                        type: {
                            basename: nsimport,
                            module: imp.type.module,
                        } as any
                    }
                    this.importedNamespaces[nsimport] = true;
                    this.importedNamespaces[nsimport] = true;
                }
                imp.importedFromNamespace = nsimport;
            } else if (imp.type.export.split(".").length > 1) {
                const nsimport = imp.type.export.split(".").shift();

                if (!this.importedNamespaces[nsimport]) {
                    this.imports[nsimport] = {
                        type: {
                            basename: nsimport,
                            module: imp.type.module,
                        } as any
                    }
                    this.importedNamespaces[nsimport] = true;
                }
                imp.importedFromNamespace = nsimport;
            }
            this.imports[imp.type.name] = imp;
        }
    }

    log(message: string, sourceStack?: string): void {
        if (sourceStack) {
            this.decorated.log(
                "Module '" + this.basename + "' -> " + sourceStack,
                message
            );
        } else {
            this.decorated.log("Module '" + this.basename + "'", message);
        }
    }
}