{{#each this~}}
{{#if this.methods.length~}}
declare namespace {{this.name}} {
    /**
    {{documentThis this.description}}
    */
    export {{this.name}}(
        {{~#if this.parameters.length~}}
            {{~#each this.parameters~}}
                {{#unless @first}} {{/unless}}{{this.name}}: {{this.type}}{{#unless @last}},{{/unless}}
            {{~/each~}}
        {{~/if~}}
    ){{#if this.returntype}}: {{this.returntype.type}}{{/if}};
}
{{/fi}}
{{~/each}}