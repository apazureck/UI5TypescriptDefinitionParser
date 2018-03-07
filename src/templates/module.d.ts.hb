declare module "{{module}}" {
    {{#each imports}}
    {{getImport this}};
    {{/each}}

    {{#if baseNamespace}}
    export = {{baseNamespace}};
    {{else}}
    export = {{moduleContent.0.basename}};
    {{/if}}

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