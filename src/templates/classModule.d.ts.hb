declare module '{{module}}' {
{{#each imports~}}{{#ifCond ../baseclass.name '!=' this.name}}{{#ifCond ../name '!=' this.name}} import { {{this.basename}}{{#if this.alias}} as {{this.alias}}{{/if}} } from '{{this.module}}';
{{/ifCond}}{{/ifCond}}
{{~/each}}
{{~#if baseclass}}import { {{baseclass.basename}}{{#ifCond baseclass.basename '==' basename}} as {{baseclass.basename}}Base{{/ifCond}}, I{{baseclass.basename}}Settings{{#ifCond baseclass.basename '==' basename}} as I{{baseclass.basename}}BaseSettings{{/ifCond}} } from '{{baseclass.module}}';{{/if}}

export interface I{{basename}}Settings
{{~#if baseclass}} extends I{{baseclass.basename}}{{#ifCond baseclass.basename '==' basename}}Base{{/ifCond}}Settings {{/if}}{
{{#each settingsInterfaceProperties}}
{{this.name}}?: {{this.type}};
{{/each}}
}

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export class {{basename}} {{#if baseclass}}extends {{baseclass.basename}}{{#ifCond baseclass.basename '==' basename}}Base{{/ifCond}}{{/if}}{

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
){{#if this.returntype}}: {{this.returntype.type}}{{/if}};

{{/each}}
{{~/if}}
    }
}