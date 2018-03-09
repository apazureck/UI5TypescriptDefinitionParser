/** 
{{documentThis description}} 
*/
{{#ifHasNamespace basename}}{{#ifCond export '!=' undefined}}export{{/ifCond}} namespace {{getNamespace basename}} { {{else}}
{{#ifHasNamespace export}}{{#ifCond export '!=' undefined}}export{{/ifCond}} namespace {{getNamespace export}} { {{/ifHasNamespace}}
{{/ifHasNamespace}}
{{#unlessHasNamespace export}}{{#ifCond export '!=' undefined}}export{{/ifCond}}{{#ifCond export '==' ''}} default {{basename}};
{{/ifCond}}{{else}}{{#unlessHasNamespace basename}}{{#ifCond export '!=' undefined}}export{{/ifCond}}{{#ifCond export '==' ''}} default {{basename}};
{{/ifCond}}{{else}}export{{/unlessHasNamespace}}{{/unlessHasNamespace}} enum {{getName basename}} {
{{#each this.properties}}
{{this.name}} = "{{this.name}}", 
{{/each}} }
{{#ifHasNamespace basename}}
}
{{else}}
{{#ifHasNamespace export}}
}
{{/ifHasNamespace}}
{{/ifHasNamespace}}