declare module '{{module}}' {
{{#each imports~}}
{{#ifCond ../baseclass.name '!=' this.type.name}}
{{#ifCond ../name '!=' this.type.name}}
{{getImport this}}
{{/ifCond}}
{{/ifCond}}
{{~/each}}
{{#ifCond baseclass.basename '==' basename}}
import * as base from '{{baseclass.module}}'
{{else}}
{{~#if baseclass}}import {{baseclass.basename}}, { I{{baseclass.basename}}Settings } from '{{baseclass.module}}';{{/if}}
{{/ifCond}}

export interface I{{basename}}Settings
{{~#if baseclass}} extends {{#ifCond baseclass.basename '==' basename}}base.{{/ifCond}}I{{baseclass.basename}}Settings {{/if}}{
{{#each settingsInterfaceProperties}}
{{this.name}}?: {{this.type}};
{{/each}}
}

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export default class {{basename}} {{#if baseclass}}extends {{#ifCond baseclass.basename '==' basename}}
base.default
{{~else}}
{{baseclass.basename}}
{{/ifCond}}
{{/if}}{

{{#if constructors.length~}}
{{#each constructors}}
/**
    {{documentThis this.description}}
*/
{{this.visibility}} {{this.name}}(
    {{~#if this.parameters.length~}}
    {{~#each this.parameters~}}
        {{#unless @first}} {{/unless}}{{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}}{{#unless @last}},{{/unless}}
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