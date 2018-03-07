/** 
{{documentThis description}} 
*/
{{#ifHasNamespace basename}}
namespace {{getNamespace basename}} {
{{else}}
{{#ifHasNamespace export}}
namespace {{getNamespace export}} {
{{/ifHasNamespace}}
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