import { GeneratorBase } from './GeneratorBase';
import { IConfig, ILogDecorator } from '../types';
import { IMethod, IParameter, IParameterProperty, IReturnValue } from '../UI5DocumentationTypes';

export class MethodGenerator extends GeneratorBase {
    private currentMethod: IMethod;
    constructor(config: IConfig, addImport: (type: string) => void, private decorated: ILogDecorator) {
        super(config);
        this.onAddImport = addImport;
    }
    


    

    

    

    

    
}