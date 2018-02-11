declare module '{{fullName}}' {
{{#each imports}}{{#unlessCond ../name '==' this.name}} import {{this.name}} from '{{this.module}}/{{this.name}}';{{/unlessCond}}
{{/each}}
{{~#if baseclass}}import { I{{baseclass.name}}Settings } from '{{baseclass.moduleName}}/{{baseclass.name}}';{{/if}}

export interface I{{name}}Settings
{{~#if baseclass}} extends I{{baseclass.name}}Settings {{/if}}{
{{#each settingsInterfaceProperties}}
{{this.name}}?: {{this.type}}
{{/each}}
}

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export default class {{name}} {{#if baseclass}}extends {{baseclass.name}}{{/if}}{

{{#if constructors.length~}}
{{#each constructors}}
/**
    {{documentThis this.description}}
*/
{{this.visibility}} {{#if this.isStatic}}static {{/if}}{{this.name}}(
    {{~#if this.parameters.length~}}
    {{~#each this.parameters~}}
        {{#unless @first}} {{/unless}}{{this.name}}: {{this.type}}{{#unless @last}},{{/unless}}
    {{~/each~}}
    {{~/if~}}
){{#if this.returntype}}: {{this.returntype.type}}{{/if}};

{{/each}}
{{~/if}}

{{#if methods.length~}}
{{#each methods}}
/**
    {{documentThis this.description}}
*/
{{this.visibility}} {{#if this.isStatic}}static {{/if}}{{this.name}}{{#if this.IsGeneric}}<{{#each this.GenericParameters}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}>{{/if}}(
    {{~#if this.parameters.length~}}
    {{~#each this.parameters~}}
        {{#unless @first}} {{/unless}}{{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}}{{#unless @last}},{{/unless}}
    {{~/each~}}
    {{~/if~}}
){{#if this.returntype}}: {{#ifIsThis this.returntype.type}}this{{else}}{{this.returntype.type}}{{/ifIsThis}}{{/if}};

{{/each}}
{{~/if}}
    }
}