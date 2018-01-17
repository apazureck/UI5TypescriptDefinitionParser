declare module '{{fullName}}' {
{{#each imports}}{{#unlessCond ../name '==' this.name}} import {{this.name}} from '{{this.module}}/{{this.name}}';{{/unlessCond}}
{{/each}}

/*$$propertyInterface$$*/

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export class {{name}} {{#if baseclass}}extends {{baseclass.name}}{{/if}}{
/*$$ctors$$*/

{{#if events.length}}
    {{#each events}}
    /**
     {{this.parsedDescription}}
    */
    {{this.visibility}} {{this.name}}: ({{#if this.parameters.length~}}{{this.parameters.0.name}}: 
            {{~#if this.parameters.0.hasCustomEventHandler~}}
                {{this.parameters.0.type}}
            {{~else~}}
                any
            {{~/if~}}
        {{/if}}) => void;
    {{/each}}
{{/if}}

{{#if methods.length~}}
{{#each methods}}
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
    }
}