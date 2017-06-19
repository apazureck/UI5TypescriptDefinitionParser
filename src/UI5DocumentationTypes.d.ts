export interface IApi {
    version: string;
    library: string;
    symbols: ISymbol[];
}

export type Kind = "namespace" | "class" | "enum" | "interface";
export type Visibility = "public" | "protected" | "private";

export type StaticType = "string"

export interface ISymbol {
    kind: Kind;
    name: string;
    basename: string;
    resource: string;
    module: string;
    export: string;
    static: boolean;
    visibility: Visibility;
    description: string;
    extends?: string;
    ui5metadata?: {};
    "constructor"?: IMethod;
    properties?: {}[];
    methods?: IMethod[];
    events?: IEvent[];
}

export interface IMethod {
    name: string;
    visibility: Visibility;
    description: string;
    parameters?: IParameter[];
    returnValue?: IReturnValue;
    static?: boolean
}

export interface IReturnValue {
    type: string;
    description?: string;
}

export interface IEvent {
    name: string;
    visibility: Visibility;
    description: string;
    parameters: IParameter[];
}

export interface IParameter {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
    parameterProperties: IParameterProperty[];
}

export interface IParameterProperty {
    name: string;
    type: string;
    optional: boolean;
    defaultValue: any;
    description: string;
}

export interface IEnum {
    kind: string;
    name: string;
    resource: string;
    module: string;
    export: string;
    static: boolean;
    visibility: Visibility;
    description: string;
    properties: IEnumProperty[]
}

export interface IEnumProperty {
    name: string;
    visibility: Visibility;
    static: boolean;
    type: StaticType
}