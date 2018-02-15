    {{~#each this~}}
    
declare namespace {{getNamespace this.name}} {
    /**
    {{documentThis this.description}}
    */
    {{~#if this.properties.length}}
    export type {{getName this.name}} = {{#each this.properties}}"{{this.name}}"{{#unless @last}} | {{/unless}}{{/each}};
    {{~else~}}
    export type {{getName this.name}} = any;
    {{~/if~}}
}
    
    {{/each}}