/** 
{{documentThis description}} 
*/
{{#ifHasNamespace basename}}namespace {{getNamespace basename}} {
    export {{else}}
{{#ifHasNamespace export}}namespace {{getNamespace export}} { 
    export{{/ifHasNamespace}}
{{/ifHasNamespace}}
enum {{getName basename}} {
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