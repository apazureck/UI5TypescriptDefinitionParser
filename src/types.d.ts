export interface IConfig {
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

export interface IDictionary {
    [key: string]: string;
}

export interface ILogDecorator {
    log(message: string, sourceStack?: string): void;
}