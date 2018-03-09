{{#if isGlobal}}
declare module "{{module}}" {
    export default {{debug moduleContent.0.name}};
}
{{else}}
declare module "{{module}}" {
    {{#each imports}}
    {{getImport this}};
    {{/each}}
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