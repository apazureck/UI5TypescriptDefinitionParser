declare namespace {{namespace}} {

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export interface {{name}} {{#if baseclass}}extends {{baseclass.name}}{{/if}}{

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
{{#if this.isStatic}}static {{/if}}{{this.name}}(
    {{~#if this.parameters.length~}}
    {{~#each this.parameters~}}
        {{#unless @first}} {{/unless}}{{this.name}}: {{this.type}}{{#unless @last}},{{/unless}}
    {{~/each~}}
    {{~/if~}}
){{#if this.returntype}}: {{#ifCond ../name '==' this.returntype.type}}this{{else}}{{this.returntype.type}}{{/ifCond}}{{/if}};

{{/each}}
{{~/if}}
    }
}