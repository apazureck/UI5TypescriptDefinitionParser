export interface Config {
    connection: {
        root: string;
        endpoints: string[];
    },
    substitutedTypes: {
        [key: string]: string;
    },
    enums: {
        [key: string]: string;
    }
}

export interface Api {
    version: string;
    library: string;
    symbols: Symbol[];
}

export type Kind = "namespace" | "class" | "enum" | "interface";
export type Visibility = "public" | "protected" | "private";

export type StaticType = "string"

export interface Symbol {
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
    "constructor"?: Method;
    properties?: {}[];
    methods?: Method[];
    events?: Event[];
}

export interface Method {
    name: string;
    visibility: Visibility;
    description: string;
    parameters?: Parameter[];
    returnValue?: ReturnValue;
}

export interface ReturnValue {
    type: string;
    description?: string;
}

export interface Event {
    name: string;
    visibility: Visibility;
    description: string;
    parameters: EventParameter[];
}

export interface EventParameter extends Parameter {
    parameterProperties: { [key: string]: EventParameterProperty[] };
}

export interface Parameter {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
}

export interface EventParameterProperty {
    name: string;
    type: string;
    optional: boolean;
}

export interface Enum {
    kind: string;
    name: string;
    resource: string;
    module: string;
    export: string;
    static: boolean;
    visibility: Visibility;
    description: string;
    properties: EnumProperty[]
}

export interface EnumProperty {
    name: string;
    visibility: Visibility;
    static: boolean;
    type: StaticType
}