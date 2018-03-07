import {ParsedBase} from '../ParsedBase';
import { IProperty, Visibility } from '../../UI5DocumentationTypes';
import { ParsedNamespace } from './ParsedNamespace';
import { IConfig, ILogDecorator } from '../../types';
export class ParsedField extends ParsedBase {
    get typings(): string { return undefined };
    constructor(private wrappedProperty: IProperty, private owner: ParsedNamespace, config: IConfig, private decorated: ILogDecorator, addimport: (type: string) => string) {
        super(config);
        this.onAddImport = addimport;
        this.createProperties(wrappedProperty, owner);
    }

    get Visibility(): Visibility {
        return this.wrappedProperty.visibility;
    }

    get description(): string {
        return this.wrappedProperty.description;
    }

    get name(): string {
        return this.wrappedProperty.name;
    }

    get type(): string {
        return this.getType(this.wrappedProperty.type);
    }

    private createProperties(wrappedProperty: IProperty, owner: ParsedNamespace): void {
        
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Field '" + this.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Field '" + this.name + "'", message);
        }
    }
}