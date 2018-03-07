import { ParsedBase } from "../ParsedBase";
import { IConfig, ILogDecorator } from "../../types";
import { ISymbol } from "../../UI5DocumentationTypes";

export class ParsedEnum extends ParsedBase {
    constructor(config: IConfig, private decorated: ILogDecorator, symbol: ISymbol, private template: HandlebarsTemplateDelegate<ISymbol>) {
        super(config);
        this.symbol = symbol;
    }
    get typings(): string {
        try {
            return this.template(this.symbol);
        } catch (error) {
            this.logger.Error("Handlebars error: " + error.message + "\n" + error.stack);
            throw error;
        }
    };
    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log(
                "Enum '" + this.basename + "' -> " + sourceStack,
                message
            );
        } else {
            this.decorated.log("Class '" + this.basename + "'", message);
        }
    }
}