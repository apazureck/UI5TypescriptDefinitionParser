declare module '{{module}}' {
    {{#each imports}}
    {{getImport this}}
    {{/each}}

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export interface {{basename}} {{#if baseclass}}extends {{baseclass.name}}{{/if}}{

{{#if events.length}}
    {{#each events}}
    /**
     {{this.parsedDescription}}
    */
    {{this.name}}: ({{#if this.parameters.length~}}{{this.parameters.0.name}}: 
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
{{this.name}}(
    {{~#if this.parameters.length~}}
    {{~#each this.parameters~}}
        {{#unless @first}} {{/unless}}{{this.name}}{{#if this.optional}}?{{/if}}: {{this.type}}{{#unless @last}},{{/unless}}
    {{~/each~}}
    {{~/if~}}
){{#if this.returntype}}: {{#ifCond ../name '==' this.returntype.type}}this{{else}}{{this.returntype.type}}{{/ifCond}}{{/if}};

{{/each}}
{{~/if}}
    }
}