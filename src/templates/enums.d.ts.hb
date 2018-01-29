    {{~#each this~}}
    {{~#if this.properties.length}}
declare namespace {{getNamespace this.name}} {
    /**
    {{documentThis this.description}}
    */
    export type {{getName this.name}} = {{#each this.properties}}"{{this.name}}"{{#unless @last}} | {{/unless}}{{/each}};
}
    {{~/if~}}
    {{/each}}