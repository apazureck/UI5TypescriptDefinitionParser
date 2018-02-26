/**
 * Translates a typescript generated define() call to a sap.ui.define() taking out the 'require' and 'exports' dependencies
 * @param aDependencies array of dependencies, including 'require' as first and 'exports' as second.
 * @param vFactory factory function with dependencies arguments, including 'require' as first and 'exports' as second.
 * @returns UI5 module.
 */
function define(aDependencies: string[], vFactory: (...args: any[]) => any): any
{
    //remove the dependencies "require" and "exports" generated by typescript compiler
    var newDependencies = aDependencies.slice(2);

    //overrides the typescript generated factory, passing to the original factory:
    // - null instead of the dependency "require"
    // - a new object with an empty "default" property as "exports"
    //and returns the default export of the typescript generated module
    var newFactory = (...args: any[]) => {
        var exports: { default: any } = { default: undefined };
        vFactory(null, exports, ...args.map((d: any) => ({ default: d })));
        return exports.default;
    };

    //call the original sap.ui.define() function, with adapted dependencies and factory
    return sap.ui.define(newDependencies, newFactory);
}

/**
 * Convert a class definition to the UI5 format of inheritance. This decorator can only be used in a class that extends from
 * another UI5 class. If your class doesn't extends from any other, don't use this decorator or make your class extend from
 * sap.ui.base.Object
 * @param name Full name of the class. This parameter will be passed to BaseClass.extend(name, ...) method at runtime.
 */
function UI5(name: string): Function
{
    return function (target: FunctionConstructor): FunctionConstructor
    {
        var functionMembers: string[] = Object.getOwnPropertyNames(function () {});
        var staticMembers:   string[] = Object.getOwnPropertyNames(target).filter(o => functionMembers.indexOf(o) === -1);
        var instanceMethods: string[] = Object.getOwnPropertyNames(target.prototype);
        
        var baseClass: any = Object.getPrototypeOf(target); // it is the same as: baseClass = target.__proto__;
        var thisClass: any = {};
        staticMembers  .forEach(m => thisClass[m] = (<any>target)[m]);
        instanceMethods.forEach(m => thisClass[m] = (<any>target.prototype)[m]);

        if (typeof baseClass.extend === "function") {
            return baseClass.extend(name, thisClass);
        }
        else {
            throw new Error("This class doesn't inherit from a UI5 class");
        }
    }
}