declare module '{{fullName}}' {
{{#each imports}}import {{this.name}} from '{{this.module}}/{{this.name}}';
{{/each}}

/*$$propertyInterface$$*/

{{#if description}}/**
{{parsedDescription}}
*/
{{/if}}
export class {{name}} {{#if extendedClass}}extends {{extendedClass}}{{/if}}{
/*$$ctors$$*/

{{#if events.length}}
    {{#each events}}
    /**
     {{this.parsedDescription}}*/
    {{this.visibility}} {{this.name}}: (oEvent: Event<{{../name}},
        {{#if this.parameters.length}}
        {{this.parameters.type}}
        {{else}}
        void
        {{/if}}>
        
        ) => void;
    {{/each}}
{{/if}}

/*$$methods$$*/
    }
}