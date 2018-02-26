declare namespace {{getNamespace this.name}} {
    /**
    {{documentThis this.description}}
    */
    {{#if this.properties.length}}
    export type {{this.basename}} = {{#each this.properties}}"{{this.name}}"{{#unless @last}} | {{/unless}}{{/each}};
    {{else}}
    export type {{this.basename}} = any;
    {{/if}}
    {{#if this.properties.length}}
    export namespace {{getName this.basename}} {
        {{#each this.properties}}
        const {{this.name}}: {{../basename}};
        {{/each}}
    }
    {{/if}}
}