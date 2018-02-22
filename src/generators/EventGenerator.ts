import { GeneratorBase } from './GeneratorBase';
import { IConfig, ILogDecorator } from '../types';
import { IEvent, IParameter, IParameterProperty } from '../UI5DocumentationTypes';
export class EventGenerator extends GeneratorBase {
    currentEvent: IEvent;
    constructor(config: IConfig, addImport: (type: string) => string, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
    }

    log(message: string, sourceStack?: string) {
        if (sourceStack) {
            this.decorated.log("Event '" + this.currentEvent.name + "' -> " + sourceStack, message);
        } else {
            this.decorated.log("Event '" + this.currentEvent.name + "'", message);
        }
    }

    
}