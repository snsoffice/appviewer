define( [ 'carousel', 'panorama', 'video5' ],

// Refer to https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
// Refer to http://www.iana.org/assignments/media-types/media-types.xhtml

function ( Carousel, Panorama, Video5 ) {

    function Showcase( options ) {
        this.element_ = document.getElementById( options.target ? options.target : 'showcase' );
        this.visible = false;
        this.mini = true;
        this.viewer = null;
        this.item = undefined;
        this.features = [];

        this.carousel_ = null;
        this.panorama_ = null;
        this.video_ = null;

        this.element_.addEventListener( 'click', Showcase.prototype.play.bind( this ),  false );
    }

    Showcase.prototype.reset = function () {
        if ( this.carousel_ !== null )
            this.carousel_.destroy();
        if ( this.panorama_ !== null )
            this.panorama_.destroy();
        if ( this.video_ !== null )
            this.video_.destroy();

        this.viewer = null;
        this.item = undefined;
        this.features = [];

        this.carousel_ = null;
        this.panorama_ = null;
        this.video_ = null;

    };

    Showcase.prototype.openItem = function ( item ) {
        if ( this.item !== undefined && this.item.name === item.name )
            return;

        this.reset();
        this.carousel_ = new Carousel();

        var data = [];
        item.features.forEach( function ( feature ) {
            var properties = feature.properties;
            this.features.push( properties );
            data.push( '<div data-name="' + properties.name + '">' +
                       '  <img class="owl-lazy" data-src="' + properties.preview + '" alt="' + properties.title + '">' +
                       '</div>' );
        } );
        this.carousel.replace( data.join('') );

    };

    Showcase.prototype.showFeature = function ( item, feature ) {

        this.openItem( item );
        var name = feature.get( 'name' );
        for ( var i = 0; i < this.features.length; i ++ )
            if ( this.features[ i ].name === name ) {
                this.carousel_.show( i );
                break;
            }

    };

    Showcase.prototype.toggle = function () {
        if ( ! this.visible )
            return;
        var element = this.element_;
        var mini = ( element.className === 'dx-mini' );
        e.currentTarget.firstElementChild.className =  mini ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        element.className = mini ? 'dx-fullscreen' : 'dx-mini';
        this.mini = ! mini;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    };

    Showcase.prototype.hide = function () {
        this.element_.style.visibility = 'hidden';
        this.visible = false;
    };

    Showcase.prototype.show = function () {
        this.element_.style.visibility = 'visible';
        this.visible = true;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    };

    Showcase.prototype.play = function () {

        if ( this.carousel_ === null )
            return;

        var pos = this.carousel_.current();
        if ( pos === null || pos < 0 )
            return;

        var feature = this.features[ pos ];
        var category = feature.category;

        if ( category === 'panorama' ) {

            if ( this.panorama_ === null ) {
                this.panorama_ = new Panorama();
            }
            this.viewer = this.panorama_;
            this.viewer.load( feature.name );
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-eject';

        }

        else if ( category === 'video' ) {
        }

    };

    Showcase.prototype.close = function () {
        if ( this.viewer === null )
            this.hide();
        else {
            // 更新缩略图
            this.viewer.close();
            this.viewer = null;
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-close';
        }
    };

    return Showcase;

});

define( [ 'owl', 'utils' ], function ( owl, utils ) {

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

        this._resizeHandler = this._core.onResize.bind( this._core )
        this._core.on( document, 'toggle-showcase', this._resizeHandler );

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
        $( '.owl-item img', element).css('max-height', height);
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
        this._core.off( document, 'toggle-showcase', this._resizeHandler );

    };

    $.fn.owlCarousel.Constructor.Plugins.FitView = FitView;

    function Carousel ( options ) {
        var target = '#carousels > div.owl-carousel';
        var baseElement = document.getElementById( 'carousels' );
        this.owl_ = $( target ).owlCarousel( {
            items: 1,
            merge: false,
            loop: true,
            lazyLoad: true,
            mergeFit: false,
            center: true,
            responsiveBaseElement: baseElement
        } );        
    }

    Carousel.prototype.current = function () {
        return this.owl_.data( 'owl.carousel' ).current();
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

    Carousel.prototype.show = function ( position ) {
        var speed = 1000;
        this.owl_.trigger( 'to.owl.carousel', [ position, speed ] );
    };

    Carousel.prototype.destroy = function () {
        this.owl_.trigger( 'destroy.owl.carousel' );
    };

    return Carousel;

});

    // $.fn.owlCarousel.Constructor.Plugins.Video5 = Video5;
    // $.fn.owlCarousel.Constructor.Plugins.RichMime = RichMime;

    // Draw video to canvas
    // ctx.drawImage(this.video, 0, 0, this.width, this.height);
    //

    // var wrapper = document.getElementById( 'carousels' );
    // $( '.owl-stage', $carousel).css('height' , wrapper.clientHeight + 'px');
    // $( '.owl-item', $carousel).css('height', wrapper.clientHeight + 'px');
    // $( '.owl-item img', $carousel).css('max-height', wrapper.clientHeight + 'px');

    // $carousel.on( 'resize.owl.carousel', function ( event ) {
    //     $( '.owl-stage', $carousel).css('height' , wrapper.clientHeight + 'px');
    //     $( '.owl-item', $carousel).css('height', wrapper.clientHeight + 'px');
    //     $( '.owl-item img', $carousel).css('max-height', wrapper.clientHeight + 'px');
    // } );

    // /**
    //  * Stops the current video.
    //  * @public
    //  */
    // FitView.prototype.stop = function() {
    //     this._core.trigger('stop', null, 'video');
    //     this._playing.find('.owl-video-frame').remove();
    //     this._playing.removeClass('owl-video-playing');
    //     this._playing = null;
    //     this._core.leave('playing');
    //     this._core.trigger('stopped', null, 'video');
    // };

    // /**
    //  * Starts the current video.
    //  * @public
    //  * @param {Event} event - The event arguments.
    //  */
    // FitView.prototype.play = function(event) {
    //     var target = $(event.target),
    //     item = target.closest('.' + this._core.settings.itemClass);

    //     if (this._playing) {
    //         return;
    //     }

    //     this._core.enter('playing');
    //     this._core.trigger('play', null, 'video');

    //     item = this._core.items(this._core.relative(item.index()));

    //     this._core.reset(item.index());

    //     $( 'video', item).get(0).play();

    //     this._playing = item.addClass('owl-video-playing');
    // };

    // this._core.$element.off('click.dx.video');
