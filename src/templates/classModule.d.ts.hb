declare module '{{fullName}}' {
{{#each imports~}}{{#ifCond ../baseclass.fullName '!=' this.module}}{{#ifCond ../fullName '!=' this.module}} import { {{this.name}}{{#if this.alias}} as {{this.alias}}{{/if}} } from '{{this.module}}';
{{/ifCond}}{{/ifCond}}
{{~/each}}
{{~#if baseclass}}import { {{baseclass.name}}{{#ifCond baseclass.name '==' name}} as {{baseclass.name}}Base{{/ifCond}}, I{{baseclass.name}}Settings } from '{{baseclass.moduleName}}/{{baseclass.name}}';{{/if}}

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
export class {{name}} {{#if baseclass}}extends {{baseclass.name}}{{#ifCond baseclass.name '==' name}}Base{{/ifCond}}{{/if}}{

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