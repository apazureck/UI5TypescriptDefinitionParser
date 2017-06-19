declare module 'sap/ui/model/json/JSONModel' {
	import { ClientModel } from 'sap/ui/model/ClientModel'
	import { Metadata } from 'sap/ui/base/Metadata'
	

/**
 * Model implementation for JSON format
 * 
 * The observation feature is experimental! When observation is activated, the application can directly change the
 * JS objects without the need to call setData, setProperty or refresh. Observation does only work for existing
 * properties in the JSON, it can not detect new properties or new array entries.
**/
    export class JSONModel<T> extends ClientModel<T> {
		/**
		 * Constructor for a new JSONModel.
		 * @param {{}} oData either the URL where to load the JSON from or a JS object
		 * @param {boolean} bObserve whether to observe the JSON data for property changes (experimental)
		 * 
		**/
		
		constructor(oData: {}, bObserve: boolean);



		/**
		 * Creates a new subclass of class sap.ui.model.json.JSONModel with name <code>sClassName</code>
and enriches it with the information contained in <code>oClassInfo</code>.

<code>oClassInfo</code> might contain the same kind of information as described in {@link sap.ui.model.ClientModel.extend}.
		 * @return {() => any} Created class / constructor function
		 * @param {string} sClassName Name of the class being created
		 * @param {{}} [oClassInfo] Object literal with information about the class
		 * @param {() => any} [FNMetaImpl] Constructor function for the metadata object; if not given, it defaults to <code>sap.ui.core.ElementMetadata</code>
		 * 
		**/
		
		static extend(sClassName: string, oClassInfo?: {}, FNMetaImpl?: () => any): () => any;
		/**
		 * Serializes the current JSON data of the model into a string.
		 * Note: May not work in Internet Explorer 8 because of lacking JSON support (works only if IE 8 mode is enabled)
		 * @return {string} sJSON the JSON data serialized as string
		 * 
		**/
		
		getJSON(): string;
		/**
		 * Returns a metadata object for class sap.ui.model.json.JSONModel.
		 * @return {Metadata} Metadata object describing this class
		 * 
		**/
		
		static getMetadata(): Metadata;
		/**
		 * Returns the value for the property with the given <code>sPropertyName</code>
		 * @return {any} the value of the property
		 * @param {string} sPath the path to the property
		 * @param {{}} [oContext] the context which will be used to retrieve the property
		 * 
		**/
		
		getProperty(sPath: keyof T, oContext?: {}): any;
		/**
		 * Load JSON-encoded data from the server using a GET HTTP request and store the resulting JSON data in the model.
		 * Note: Due to browser security restrictions, most "Ajax" requests are subject to the same origin policy,
		 * the request can not successfully retrieve data from a different domain, subdomain, or protocol.
		 * @param {string} sURL A string containing the URL to which the request is sent.
		 * @param {{}|string} [oParameters] A map or string that is sent to the server with the request.
		 * Data that is sent to the server is appended to the URL as a query string.
		 * If the value of the data parameter is an object (map), it is converted to a string and
		 * url-encoded before it is appended to the URL.
		 * @param {boolean} [bAsync] By default, all requests are sent asynchronous
		 * (i.e. this is set to true by default). If you need synchronous requests, set this option to false.
		 * Cross-domain requests do not support synchronous operation. Note that synchronous requests may
		 * temporarily lock the browser, disabling any actions while the request is active.
		 * @param {string} [sType] The type of request to make ("POST" or "GET"), default is "GET".
		 * Note: Other HTTP request methods, such as PUT and DELETE, can also be used here, but
		 * they are not supported by all browsers.
		 * @param {boolean} [bMerge] whether the data should be merged instead of replaced
		 * @param {string} [bCache] force no caching if false. Default is false
		 * @param {{}} [mHeaders] An object of additional header key/value pairs to send along with the request
		 * 
		**/
		
		loadData(sURL: string, oParameters?: {}|string, bAsync?: boolean, sType?: string, bMerge?: boolean, bCache?: string, mHeaders?: {}): void;

		/**
		 * Sets the JSON encoded data to the model.
		 * @param {{}} oData the data to set on the model
		 * 
		**/
		setData(oData: T): void;
		/**
		 * Sets the JSON encoded data to the model. Replaces optional parameters.
		 * @param {{}} oData the data to set on the model
		 * @param {boolean} [bMerge] whether to merge the data instead of replacing it
		 * 
		**/
		setData(oData: { [P in keyof T]?: T[P]; }, bMerge: boolean): void;
		/**
		 * Sets the JSON encoded string data to the model.
		 * @param {string} sJSONText the string data to set on the model
		 * @param {boolean} [bMerge] whether to merge the data instead of replacing it
		 * 
		**/
		
		setJSON(sJSONText: string, bMerge?: boolean): void;
		/**
		 * Sets a new value for the given property <code>sPropertyName</code> in the model.
		 * If the model value changed all interested parties are informed.
		 * @return {boolean} true if the value was set correctly and false if errors occurred like the entry was not found.
		 * @param {string} sPath path of the property to set
		 * @param {any} oValue value to set the property to
		 * @param {{}} [oContext] the context which will be used to set the property
		 * @param {boolean} [bAsyncUpdate] whether to update other bindings dependent on this property asynchronously
		 * 
		**/
		
		setProperty(sPath: string, oValue: any, oContext?: {}, bAsyncUpdate?: boolean): boolean;
    }
}