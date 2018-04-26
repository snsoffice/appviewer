define( [ 'ifuture', 'owl', 'utils', 'jquery' ],

function( ifuture, owl, utils, $ ) {

    /**
     * Creates the fit view plugin.
     * @class The FitView Plugin
     * @param {Owl} carousel - The Owl Carousel
     */
    var FitView = function(carousel) {
	/**
	 * Reference to the core.
	 * @protected
	 * @type {Owl}
	 */
	this._core = carousel;

	/**
	 * All event handlers.
	 * @todo The cloned content removale is too late
	 * @protected
	 * @type {Object}
	 */
	this._handlers = {
	    'initialized.owl.carousel': $.proxy(function(e) {
		if (e.namespace) {
		    this.update();
		}
	    }, this),
	    'resize.owl.carousel': $.proxy(function(e) {
		if (e.namespace) {
                    this.update();
		}
	    }, this),
	};

	// set default options
	// this._core.options = $.extend({}, FitView.Defaults, this._core.options);

	// register event handlers
	this._core.$element.on( this._handlers );

    };

    /**
     * Default options.
     * @public
     */
    FitView.Defaults = {
	view: window,
    };

    /**
     * Gets viewport height.
     * @protected
     * @return {Number} - The height in pixel.
     */
    FitView.prototype.viewport = function() {
	var height;
	if (this._core.options.responsiveBaseElement !== window) {
	    height = $(this._core.options.responsiveBaseElement).height();
	} else if (window.innerHeight) {
	    height = window.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) {
	    height = document.documentElement.clientHeight;
	} else {
	    console.warn('Can not detect viewport height.');
	}
	return height;
    };

    /**
     * Update height of .owl-item, max-height of img,
     * @public
     */
    FitView.prototype.update = function() {
        var height = this.viewport() + 'px';
        var element = this._core.$element;
        $( '.owl-stage', element).css('height' , height);
        $( '.owl-item', element).css('height', height);
    };

    /**
     * Destroys the plugin.
     */
    FitView.prototype.destroy = function() {
	var handler, property;

	for (handler in this._handlers) {
	    this._core.$element.off(handler, this._handlers[handler]);
	}
	for (property in Object.getOwnPropertyNames(this)) {
	    typeof this[property] != 'function' && (this[property] = null);
	}
    };

    $.fn.owlCarousel.Constructor.Plugins.FitView = FitView;


    var Carousel = function ( app, opt_options ) {
        // ifuture.Component.call( this );

        this.name = 'carousel';
        this.title = '旋转木马';

        var id = opt_options.target ? opt_options.target : 'explorer-carousel';
        var target = '#' + id + ' > div.owl-carousel';
        var baseElement = document.getElementById( id );
        this.owl_ = $( target ).owlCarousel( {
            items: 1,
            merge: false,
            loop: true,
            lazyLoad: true,
            mergeFit: false,
            center: true,
            responsiveBaseElement: baseElement
        } );

        this.owl_.on( 'translated.owl.carousel', function ( event ) {
            var pos = ( event.item.index - 2 ) % event.item.count;
            app.dispatchEvent( new ifuture.Event( 'carousel:changed', pos ) );
        } );

    }
    // ifuture.inherits( Carousel, ifuture.Component );

    Carousel.prototype.current = function () {
        return this.owl_.data( 'owl.carousel' ).current();
    };

    Carousel.prototype.to = function ( position, speed ) {
        speed = speed === undefined ? 500 : speed;
        this.owl_.trigger( 'to.owl.carousel', [ position, speed ] );
    };

    Carousel.prototype.add = function ( item, position ) {
        this.owl_.trigger( 'add.owl.carousel', [ item, position ] );
    };

    Carousel.prototype.remove = function ( position ) {
        this.owl_.trigger( 'remove.owl.carousel', position );
    };

    Carousel.prototype.replace = function ( data ) {
        this.owl_.trigger( 'replace.owl.carousel', data );
    };

    Carousel.prototype.resize = function () {
        this.owl_.trigger( 'resize.owl.carousel' );
        this.owl_.data( 'owl.carousel' ).onResize();
        // 解决初始化之后宽度设置不正确的问题
        if ( this.current() === 0 )
            this.to( 0, 0 );
    };

    Carousel.prototype.show = function ( position ) {
        var speed = 1000;
        this.owl_.trigger( 'to.owl.carousel', [ position, speed ] );
    };

    Carousel.prototype.destroy = function () {
        this.owl_.trigger( 'destroy.owl.carousel' );
    };

    return Carousel;

} );
