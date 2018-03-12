{{#if isGlobal}}
declare module "{{module}}" {
    export = {{moduleContent.0.name}};
}
{{else}}
declare module "{{module}}" {
    {{#each imports}}
    {{getImport this}};
    {{/each}}

    export = {{moduleContent.0.basename}};

    {{#if excludedFromBaseNamespace}}
    {{#each excludedFromBaseNamespace}}
    {{this.typings}}
    {{/each}}
    {{/if}}
    {{#if baseNamespace}}
    namespace {{baseNamespace}} {
    {{/if}}
    {{#each moduleContent}}
    {{this.typings}}
    {{/each}}
    {{#if baseNamespace}}
    }
    {{/if}}
}
{{/if}}