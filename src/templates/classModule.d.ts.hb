{{#ifCond baseclass.basename '==' basename}}
import {{getName basename}}Base from '{{baseclass.module}}'
{{/ifCond}}
{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
{{#ifHasNamespace basename}}
namespace {{getNamespace basename}} {
{{else}}
{{#ifHasNamespace export}}
namespace {{getNamespace export}} {
{{/ifHasNamespace}}
{{/ifHasNamespace}}
class {{getName basename}} {{#if baseclass}}extends {{#ifCond baseclass.basename '==' basename~}}
{{getName basename}}Base
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
);

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
{{#ifHasNamespace basename}}
}
{{else}}
{{#ifHasNamespace export}}
}
{{/ifHasNamespace}}
{{/ifHasNamespace}}