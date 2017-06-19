declare module 'sap/ui/model/Model' {
	import { MessageProcessor } from 'sap/ui/core/message/MessageProcessor'
	import { Event } from 'sap/ui/base/Event'
	import { ContextBinding } from 'sap/ui/model/ContextBinding'
	import { ListBinding } from 'sap/ui/model/ListBinding'
	import { Sorter } from 'sap/ui/model/Sorter'
	import { PropertyBinding } from 'sap/ui/model/PropertyBinding'
	import { TreeBinding } from 'sap/ui/model/TreeBinding'
	import { Context } from 'sap/ui/model/Context'
	import { ChangeReason } from 'sap/ui/model/ChangeReason'
	import { Metadata } from 'sap/ui/base/Metadata'
	import { MetaModel } from 'sap/ui/model/MetaModel'
	

/**
 * This is an abstract base class for model objects.
**/
    export class Model<T> extends MessageProcessor {
		/**
		 * Constructor for a new Model.
		 * 
		 * Every Model is a MessageProcessor that is able to handle Messages with the normal binding path syntax in the target.
		 * 
		**/
		
		constructor();

		/**
		 * The 'parseError' event is fired when parsing of a model document (e.g. XML response) fails.
		 * @param {Event} oEvent undefined
		 * 
		**/
		parseError: (oEvent: Event) => void;
		/**
		 * The 'propertyChange' event is fired when changes occur to a property value in the model. The event contains a reason parameter which describes the cause of the property value change.
		 * Currently the event is only fired with reason <code>sap.ui.model.ChangeReason.Binding</code> which is fired when two way changes occur to a value of a property binding.
		 * 
		 * Note: Subclasses might add additional parameters to the event object. Optional parameters can be omitted.
		 * @param {Event} oEvent undefined
		 * 
		**/
		propertyChange: (oEvent: Event) => void;
		/**
		 * The 'requestCompleted' event is fired, after a request has been completed (includes receiving a response),
		 * no matter whether the request succeeded or not.
		 * 
		 * Note: Subclasses might add additional parameters to the event object. Optional parameters can be omitted.
		 * @param {Event} oEvent undefined
		 * 
		**/
		requestCompleted: (oEvent: Event) => void;
		/**
		 * The 'requestFailed' event is fired, when data retrieval from a backend failed.
		 * 
		 * Note: Subclasses might add additional parameters to the event object. Optional parameters can be omitted.
		 * @param {Event} oEvent undefined
		 * 
		**/
		requestFailed: (oEvent: Event) => void;
		/**
		 * The 'requestSent' event is fired, after a request has been sent to a backend.
		 * 
		 * Note: Subclasses might add additional parameters to the event object. Optional parameters can be omitted.
		 * @param {Event} oEvent undefined
		 * 
		**/
		requestSent: (oEvent: Event) => void;

		/**
		 * Attach event-handler <code>fnFunction</code> to the 'parseError' event of this <code>sap.ui.model.Model</code>.<br/>
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachParseError(fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'parseError' event of this <code>sap.ui.model.Model</code>.<br/>
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} oData The object, that should be passed along with the event-object when firing the event.
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachParseError(oData: {}, fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'propertyChange' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachPropertyChange(fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'propertyChange' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} oData The object, that should be passed along with the event-object when firing the event.
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachPropertyChange(oData: {}, fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestCompleted' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachRequestCompleted(fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestCompleted' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} oData The object, that should be passed along with the event-object when firing the event.
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachRequestCompleted(oData: {}, fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestFailed' event of this <code>sap.ui.model.Model</code>.<br/>
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, this Model is used.
		 * 
		**/
		
		attachRequestFailed(fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestFailed' event of this <code>sap.ui.model.Model</code>.<br/>
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} oData The object, that should be passed along with the event-object when firing the event.
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, this Model is used.
		 * 
		**/
		
		attachRequestFailed(oData: {}, fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestSent' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachRequestSent(fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Attach event-handler <code>fnFunction</code> to the 'requestSent' event of this <code>sap.ui.model.Model</code>.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} oData The object, that should be passed along with the event-object when firing the event.
		 * @param {() => any} fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {{}} [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 * 
		**/
		
		attachRequestSent(oData: {}, fnFunction: () => any, oListener?: {}): Model<T>;
		/**
		 * Create ContextBinding
		 * @return {ContextBinding} undefined
		 * @param {string|{}} sPath the path pointing to the property that should be bound or an object
		 *         which contains the following parameter properties: path, context, parameters
		 * @param {{}} [oContext] the context object for this databinding (optional)
		 * @param {{}} [mParameters] additional model specific parameters (optional)
		 * @param {{}} [oEvents] event handlers can be passed to the binding ({change:myHandler})
		 * 
		**/
		
		bindContext(sPath: string|{}, oContext?: {}, mParameters?: {}, oEvents?: {}): ContextBinding;
		/**
		 * Implement in inheriting classes
		 * @return {ListBinding} undefined
		 * @param {string} sPath the path pointing to the list / array that should be bound
		 * @param {{}} [oContext] the context object for this databinding (optional)
		 * @param {Sorter} [aSorters] initial sort order (can be either a sorter or an array of sorters) (optional)
		 * @param {any[]} [aFilters] predefined filter/s (can be either a filter or an array of filters) (optional)
		 * @param {{}} [mParameters] additional model specific parameters (optional)
		 * 
		**/
		
		bindList(sPath: string, oContext?: {}, aSorters?: Sorter, aFilters?: any[], mParameters?: {}): ListBinding;
		/**
		 * Implement in inheriting classes
		 * @return {PropertyBinding} undefined
		 * @param {string} sPath the path pointing to the property that should be bound
		 * @param {{}} [oContext] the context object for this databinding (optional)
		 * @param {{}} [mParameters] additional model specific parameters (optional)
		 * 
		**/
		
		bindProperty(sPath: string, oContext?: {}, mParameters?: {}): PropertyBinding;
		/**
		 * Implement in inheriting classes
		 * @return {TreeBinding} undefined
		 * @param {string} sPath the path pointing to the tree / array that should be bound
		 * @param {{}} [oContext] the context object for this databinding (optional)
		 * @param {any[]} [aFilters] predefined filter/s contained in an array (optional)
		 * @param {{}} [mParameters] additional model specific parameters (optional)
		 * @param {any[]} [aSorters] predefined sap.ui.model.sorter/s contained in an array (optional)
		 * 
		**/
		
		bindTree(sPath: string, oContext?: {}, aFilters?: any[], mParameters?: {}, aSorters?: any[]): TreeBinding;
		/**
		 * Implement in inheriting classes
		 * @return {Context} the binding context, if it could be created synchronously
		 * @param {string} sPath the path to create the new context from
		 * @param {{}} [oContext] the context which should be used to create the new binding context
		 * @param {{}} [mParameters] the parameters used to create the new binding context
		 * @param {() => any} [fnCallBack] the function which should be called after the binding context has been created
		 * @param {boolean} [bReload] force reload even if data is already available. For server side models this should
		 *                   refetch the data from the server
		 * 
		**/
		
		createBindingContext(sPath: string, oContext?: {}, mParameters?: {}, fnCallBack?: () => any, bReload?: boolean): Context;
		/**
		 * Destroys the model and clears the model data.
		 * A model implementation may override this function and perform model specific cleanup tasks e.g.
		 * abort requests, prevent new requests, etc.
		 * 
		**/
		
		destroy(): void;
		/**
		 * Implement in inheriting classes
		 * @param {{}} oContext to destroy
		 * 
		**/
		
		destroyBindingContext(oContext: {}): void;
		/**
		 * Detach event-handler <code>fnFunction</code> from the 'parseError' event of this <code>sap.ui.model.Model</code>.<br/>
		 * 
		 * The passed function and listener object must match the ones previously used for event registration.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs.
		 * @param {{}} oListener Object on which the given function had to be called.
		 * 
		**/
		
		detachParseError(fnFunction: () => any, oListener: {}): Model<T>;
		/**
		 * Detach event-handler <code>fnFunction</code> from the 'propertyChange' event of this <code>sap.ui.model.Model</code>.
		 * 
		 * The passed function and listener object must match the ones previously used for event registration.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs.
		 * @param {{}} oListener Object on which the given function had to be called.
		 * 
		**/
		
		detachPropertyChange(fnFunction: () => any, oListener: {}): Model<T>;
		/**
		 * Detach event-handler <code>fnFunction</code> from the 'requestCompleted' event of this <code>sap.ui.model.Model</code>.
		 * 
		 * The passed function and listener object must match the ones previously used for event registration.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs.
		 * @param {{}} oListener Object on which the given function had to be called.
		 * 
		**/
		
		detachRequestCompleted(fnFunction: () => any, oListener: {}): Model<T>;
		/**
		 * Detach event-handler <code>fnFunction</code> from the 'requestFailed' event of this <code>sap.ui.model.Model</code>.<br/>
		 * 
		 * The passed function and listener object must match the ones previously used for event registration.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs.
		 * @param {{}} oListener Object on which the given function had to be called.
		 * 
		**/
		
		detachRequestFailed(fnFunction: () => any, oListener: {}): Model<T>;
		/**
		 * Detach event-handler <code>fnFunction</code> from the 'requestSent' event of this <code>sap.ui.model.Model</code>.
		 * 
		 * The passed function and listener object must match the ones previously used for event registration.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {() => any} fnFunction The function to call, when the event occurs.
		 * @param {{}} oListener Object on which the given function had to be called.
		 * 
		**/
		
		detachRequestSent(fnFunction: () => any, oListener: {}): Model<T>;
		/**
		 * Creates a new subclass of class sap.ui.model.Model with name <code>sClassName</code>
and enriches it with the information contained in <code>oClassInfo</code>.

<code>oClassInfo</code> might contain the same kind of information as described in {@link sap.ui.core.message.MessageProcessor.extend}.
		 * @return {() => any} Created class / constructor function
		 * @param {string} sClassName Name of the class being created
		 * @param {{}} [oClassInfo] Object literal with information about the class
		 * @param {() => any} [FNMetaImpl] Constructor function for the metadata object; if not given, it defaults to <code>sap.ui.core.ElementMetadata</code>
		 * 
		**/
		
		static extend(sClassName: string, oClassInfo?: {}, FNMetaImpl?: () => any): () => any;
		/**
		 * Fire event parseError to attached listeners.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} [mArguments] the arguments to pass along with the event.
		 * 
		**/
		
		protected fireParseError(mArguments?: { errorCode?: number, url?: string, reason?: string, srcText?: string, line?: number, linepos?: number, filepos?: number, }): Model<T>;
		/**
		 * Fire event propertyChange to attached listeners.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} [mArguments] the arguments to pass along with the event.
		 * 
		**/
		
		protected firePropertyChange(mArguments?: { /* * The reason of the property change */
		reason?: ChangeReason, /* * The path of the property */
		path?: string, /* * the context of the property */
		context?: {}, /* * the value of the property */
		value?: {}, }): Model<T>;
		/**
		 * Fire event requestCompleted to attached listeners.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} [mArguments] the arguments to pass along with the event.
		 * 
		**/
		
		protected fireRequestCompleted(mArguments?: { /* * The url which was sent to the backend. */
		url?: string, /* * The type of the request (if available) */
		type?: string, /* * If the request was synchronous or asynchronous (if available) */
		async?: boolean, /* * additional information for the request (if available) <strong>deprecated</strong> */
		info?: string, /* * Additional information for the request (if available) */
		infoObject?: {}, }): Model<T>;
		/**
		 * Fire event requestFailed to attached listeners.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} [mArguments] the arguments to pass along with the event.
		 * 
		**/
		
		protected fireRequestFailed(mArguments?: { /* * A text that describes the failure. */
		message?: string, /* * HTTP status code returned by the request (if available) */
		statusCode?: string, /* * The status as a text, details not specified, intended only for diagnosis output */
		statusText?: string, /* * Response that has been received for the request ,as a text string */
		responseText?: string, }): Model<T>;
		/**
		 * Fire event requestSent to attached listeners.
		 * @return {Model} <code>this</code> to allow method chaining
		 * @param {{}} [mArguments] the arguments to pass along with the event.
		 * 
		**/
		
		protected fireRequestSent(mArguments?: { /* * The url which is sent to the backend. */
		url?: string, /* * The type of the request (if available) */
		type?: string, /* * If the request is synchronous or asynchronous (if available) */
		async?: boolean, /* * additional information for the request (if available) <strong>deprecated</strong> */
		info?: string, /* * Additional information for the request (if available) */
		infoObject?: {}, }): Model<T>;
		/**
		 * Get the default binding mode for the model
		 * @return {sap.ui.model.BindingMode} default binding mode of the model
		 * 
		**/
		
		getDefaultBindingMode(): sap.ui.model.BindingMode;
		/**
		 * Get messages for path
		 * @param {string} sPath The binding path
		 * 
		**/
		
		protected getMessagesByPath(sPath: string): void;
		/**
		 * Returns a metadata object for class sap.ui.model.Model.
		 * @return {Metadata} Metadata object describing this class
		 * 
		**/
		
		static getMetadata(): Metadata;
		/**
		 * Returns the meta model associated with this model if it is available for the concrete
		 * model type.
		 * @return {MetaModel} The meta model or undefined if no meta model exists.
		 * 
		**/
		
		getMetaModel(): MetaModel;
		/**
		 * Implement in inheriting classes
		 * @param {string} sPath the path to where to read the object
		 * @param {{}} [oContext] the context with which the path should be resolved
		 * @param {{}} [mParameters] additional model specific parameters
		 * 
		**/
		
		getObject(sPath: string, oContext?: {}, mParameters?: {}): void;
		/**
		 * Returns the original value for the property with the given path and context.
		 * The original value is the value that was last responded by a server if using a server model implementation.
		 * @return {any} vValue the value of the property
		 * @param {string} sPath the path/name of the property
		 * @param {{}} [oContext] the context if available to access the property value
		 * 
		**/
		
		getOriginalProperty(sPath: string, oContext?: {}): any;
		/**
		 * Implement in inheriting classes
		 * @param {string} sPath the path to where to read the attribute value
		 * @param {{}} [oContext] the context with which the path should be resolved
		 * 
		**/
		
		getProperty(sPath: keyof T, oContext?: {}): void;
		/**
		 * Check if the specified binding mode is supported by the model.
		 * @param {sap.ui.model.BindingMode} sMode the binding mode to check
		 * 
		**/
		
		isBindingModeSupported(sMode: sap.ui.model.BindingMode): void;
		/**
		 * Returns whether legacy path syntax is used
		 * @return {boolean} undefined
		 * 
		**/
		
		isLegacySyntax(): boolean;
		/**
		 * Refresh the model.
		 * This will check all bindings for updated data and update the controls if data has been changed.
		 * @param {boolean} bForceUpdate Update controls even if data has not been changed
		 * 
		**/
		
		refresh(bForceUpdate: boolean): void;
		/**
		 * Set the default binding mode for the model. If the default binding mode should be changed,
		 * this method should be called directly after model instance creation and before any binding creation.
		 * Otherwise it is not guaranteed that the existing bindings will be updated with the new binding mode.
		 * @return {Model} this pointer for chaining
		 * @param {sap.ui.model.BindingMode} sMode the default binding mode to set for the model
		 * 
		**/
		
		setDefaultBindingMode(sMode: sap.ui.model.BindingMode): Model;
		/**
		 * Enables legacy path syntax handling
		 * 
		 * This defines, whether relative bindings, which do not have a defined
		 * binding context, should be compatible to earlier releases which means
		 * they are resolved relative to the root element or handled strict and
		 * stay unresolved until a binding context is set
		 * @param {boolean} bLegacySyntax the path syntax to use
		 * 
		**/
		
		setLegacySyntax(bLegacySyntax: boolean): void;
		/**
		 * Sets messages
		 * @param {{}} mMessages Messages for this model
		 * 
		**/
		
		setMessages(mMessages: {}): void;
		/**
		 * Set the maximum number of entries which are used for list bindings.
		 * @param {number} iSizeLimit collection size limit
		 * 
		**/
		
		setSizeLimit(iSizeLimit: number): void;
    }
}