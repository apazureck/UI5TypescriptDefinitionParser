declare module 'sap/ui/base/Event' {
    import Object from 'sap/ui/base/Object'
    import Metadata from 'sap/ui/base/Metadata'
    import EventProvider from 'sap/ui/base/EventProvider'


	/**
	 * An Event object consisting of an id, a source and a map of parameters
	**/
    export default class Event<Tsource extends EventProvider, Tparameters> extends Object {
		/**
		 * Creates an event with the given <code>sId</code>, linked to the provided <code>oSource</code> and enriched with the <code>mParameters</code>.
		 * @param {string} sId The id of the event
		 * @param {EventProvider} oSource The source of the event
		 * @param {{}} mParameters A map of parameters for this event
		 * 
		**/

        constructor(sId: string, oSource: EventProvider, mParameters: {});



		/**
		 * Cancel bubbling of the event.
		 * 
		 * <b>Note:</b> This function only has an effect if the bubbling of the event is supported by the event source.
		 * 
		**/

        cancelBubble(): void;
		/**
		 * Creates a new subclass of class sap.ui.base.Event with name <code>sClassName</code>
and enriches it with the information contained in <code>oClassInfo</code>.

<code>oClassInfo</code> might contain the same kind of information as described in {@link sap.ui.base.Object.extend}.
		 * @return {() => any} Created class / constructor function
		 * @param {string} sClassName Name of the class being created
		 * @param {{}} [oClassInfo] Object literal with information about the class
		 * @param {() => any} [FNMetaImpl] Constructor function for the metadata object; if not given, it defaults to <code>sap.ui.core.ElementMetadata</code>
		 * 
		**/

        static extend(sClassName: string, oClassInfo?: {}, FNMetaImpl?: () => any): () => any;
		/**
		 * Returns the id of the event.
		 * @return {string} The id of the event
		 * 
		**/

        getId(): string;
		/**
		 * Returns a metadata object for class sap.ui.base.Event.
		 * @return {Metadata} Metadata object describing this class
		 * 
		**/

        static getMetadata(): Metadata;
		/**
		 * Returns the value of the parameter with the given sName.
		 * @return {any} The value for the named parameter
		 * @param {string} sName The name of the parameter to return
		 * 
		**/

        getParameter<K extends keyof Tparameters>(sName: K): Tparameters[K];
		/**
		 * Returns all parameter values of the event keyed by their names.
		 * @return {any} All parameters of the event keyed by name
		 * 
		**/

        getParameters(): Tparameters;
		/**
		 * Returns the event provider on which the event was fired.
		 * @return {EventProvider} The source of the event
		 * 
		**/

        getSource(): Tsource;
		/**
		 * Prevent the default action of this event.
		 * 
		 * <b>Note:</b> This function only has an effect if preventing the default action of the event is supported by the event source.
		 * 
		**/

        preventDefault(): void;
    }
}