declare namespace {{getNamespace this.name}} {
    /**
    {{documentThis this.description}}
    */
    {{#if this.properties.length}}
    export enum {{getName basename}} {
    {{#each this.properties}}
    {{this.name}} = "{{this.name}}", 
    {{/each}}
    }
    {{/if}}
}