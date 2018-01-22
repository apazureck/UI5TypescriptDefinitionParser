declare module "sap/ui/model/ClientModel" {
  import Model from "sap/ui/model/Model";
  import Metadata from "sap/ui/base/Metadata";

  /**
   * Model implementation for Client models
   **/
  export default class ClientModel<T> extends Model<T> {
    /**
     * Constructor for a new ClientModel.
     * @param {{}} oData URL where to load the data from
     *
     **/

    constructor(oData: {});

    destroy(): void;
    /**
		 * Creates a new subclass of class sap.ui.model.ClientModel with name <code>sClassName</code>
and enriches it with the information contained in <code>oClassInfo</code>.

<code>oClassInfo</code> might contain the same kind of information as described in {@link sap.ui.model.Model.extend}.
		 * @return {() => any} Created class / constructor function
		 * @param {string} sClassName Name of the class being created
		 * @param {{}} [oClassInfo] Object literal with information about the class
		 * @param {() => any} [FNMetaImpl] Constructor function for the metadata object; if not given, it defaults to <code>sap.ui.core.ElementMetadata</code>
		 * 
		**/

    static extend(
      sClassName: string,
      oClassInfo?: {},
      FNMetaImpl?: () => any
    ): () => any;
    /**
     * Force no caching.
     * @param {boolean} [bForceNoCache] whether to force not to cache
     *
     **/

    forceNoCache(bForceNoCache?: boolean): void;
    /**
     * Returns the current data of the model.
     * Be aware that the returned object is a reference to the model data so all changes to that data will also change the model data.
     * @return {any} the data object
     *
     **/

    getData(): T;
    /**
     * Returns a metadata object for class sap.ui.model.ClientModel.
     * @return {Metadata} Metadata object describing this class
     *
     **/

    static getMetadata(): Metadata;
    /**
     * update all bindings
     * @param {boolean} bForceUpdate true/false: Default = false. If set to false an update
     * 					will only be done when the value of a binding changed.
     *
     **/

    updateBindings(bForceUpdate: boolean): void;
  }
}
