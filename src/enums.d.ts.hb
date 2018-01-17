declare namespace {{getNamespace this.0.name}} {
    {{~#each this~}}
    {{~#if this.properties.length}}

    /**
    {{documentThis this.description}}
    */
    export type {{getName this.name}} = {{#each this.properties}}"{{this.name}}"{{#unless @last}} | {{/unless}}{{/each}};
    {{~/if~}}
    {{/each}}

}