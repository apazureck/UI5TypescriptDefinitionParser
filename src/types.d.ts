export interface Config {
    connection: {
        root: string;
        endpoints: string[];
    }
}

export interface Api {
    version: string;
    library: string;
    symbols: Symbol[];
}

export type Kind = "namespace" | "class" | "enum" | "interface";
export type Visibility = "public" | "protected" | "private"

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
    "constructor"?: {};
    properties?: {}[];
    methods?: {}[];
    events?: Event[];
}

export interface Event {
    name: string;
    visibility: Visibility;
    description: string;
    parameters: EventParameter[];
}

export interface EventParameter {
    name: string;
    type: string;
    parameterProperties: { [key: string]: EventParameterProperty[] };
}

export interface EventParameterProperty {
    name: string;
    type: string;
    optional: boolean;
}