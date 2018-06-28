define( [ 'ol' ], function ( ol ) {

    /**
     * @classdesc
     * Stripped down implementation of the W3C DOM Level 2 Event interface.
     * @see {@link https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface}
     *
     * This implementation only provides `type` and `target` properties, and
     * `stopPropagation` and `preventDefault` methods. It is meant as base class
     * for higher level events defined in the library, and works with {@link EventTarget}.
     *
     * @constructor
     * @implements {Event}
     * @param {string} type Type.
     */
    Event = function( type, argument ) {

        /**
         * @type {boolean}
         */
        this.propagationStopped;

        /**
         * The event type.
         * @type {string}
         * @api
         */
        this.type = type;

        /**
         * The argument object of event.
         * @type {Object}
         * @api
         */
        this.argument = argument;

        /**
         * The event target.
         * @type {Object}
         * @api
         */
        this.target = null;

    };


    /**
     * Stop event propagation.
     * @function
     * @override
     * @api
     */
    Event.prototype.preventDefault =

    /**
     * Stop event propagation.
     * @function
     * @override
     * @api
     */
    Event.prototype.stopPropagation = function() {
        this.propagationStopped = true;
    };


    /**
     * @param {Event|Event} evt Event
     */
    Event.stopPropagation = function(evt) {
        evt.stopPropagation();
    };


    /**
     * @param {Event|Event} evt Event
     */
    Event.preventDefault = function(evt) {
        evt.preventDefault();
    };

    /*
     * Base class for iFuture
     *
     * Usage:
     *
     *    function ChildClass( a, b ) {
     *      ifuture.Component.call( this );
     *      this.a_ = a;
     *      this.b_ = b;
     *    }
     *
     *    ifuture.inherits( ChildClass, ifuture.Component );
     */
    function Component( app ) {
        ol.Object.call( this );
        this.app = app;
    }
    ol.inherits( Component, ol.Object );

    Component.prototype.dispatchEvent = function ( e ) {
        // DEBUG:
        // console.log( e.type );
        ol.Object.prototype.dispatchEvent.call( this.app === undefined ? this : this.app, e );
    };

    Component.prototype.bindFutureEvent = function () {
    };

    return {
        Event: Event,
        Component: Component,
        inherits: ol.inherits
    }

});
