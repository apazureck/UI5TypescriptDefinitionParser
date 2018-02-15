export interface IApi {
    version: string;
    library: string;
    symbols: ISymbol[];
}

export type Kind = "namespace" | "class" | "enum" | "interface";
export type Visibility = "public" | "protected" | "private";

export type StaticType = "string";

export type Cardinality = "0..n";

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
    "ui5-metadata"?: {
        properties: IProperty[];
        associations: IAssociation;
        events: IMetaEvent;
    };
    "constructor"?: IMethod;
    properties?: {}[];
    methods?: IMethod[];
    events?: IEvent[];
}

export interface IProperty {
    name: string;
    type: string;
    defaultValue: string;
    group: string;
    visibility: Visibility;
    description: string;
    methods: string[];
}

export interface IAssociation {
    name: string;
    singularName: string;
    type: string;
    cardinality: Cardinality;
    description: string;
    methods: string[];
}

export interface IMetaEvent {
    name: string;
    visibility: Visibility;
    description: string;
    deprecated?: {
        since: string;
        text: string;
    }
    methods: string[]
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
    unknown?: boolean;
    rawTypes: { [key: string]: string }
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
    typeAlreadyProcessed?: boolean;
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