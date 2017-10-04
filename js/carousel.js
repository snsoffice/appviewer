define( [ 'owl', 'utils' ], function ( owl, utils ) {

    // Plugins: Video5, RichMime, Fleet

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
	 * Current playing item.
	 * @protected
	 * @type {jQuery}
	 */
	this._playing = null;

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
	this._core.$element.on(this._handlers);

        // document.addEventListener( 'toggle-carousels', this._core.onResize.bind(this._core), false );
        this._core.on( document, 'toggle-carousels', this._core.onResize.bind(this._core) );

        this._core.$element.on('click.dx.video', '.dx-video-play-icon', $.proxy(function(e) {
	    this.play(e);
	}, this));
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
     * Stops the current video.
     * @public
     */
    FitView.prototype.stop = function() {
	this._core.trigger('stop', null, 'video');
	this._playing.find('.owl-video-frame').remove();
	this._playing.removeClass('owl-video-playing');
	this._playing = null;
	this._core.leave('playing');
	this._core.trigger('stopped', null, 'video');
    };

    /**
     * Starts the current video.
     * @public
     * @param {Event} event - The event arguments.
     */
    FitView.prototype.play = function(event) {
	var target = $(event.target),
	item = target.closest('.' + this._core.settings.itemClass);

	if (this._playing) {
	    return;
	}

	this._core.enter('playing');
	this._core.trigger('play', null, 'video');

	item = this._core.items(this._core.relative(item.index()));

	this._core.reset(item.index());

        $( 'video', item).get(0).play();

	this._playing = item.addClass('owl-video-playing');
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
        // document.removeEventListener( 'toggle-carousels', this._core.onResize, false );
        this._core.off( document, 'toggle-carousels' );

        this._core.$element.off('click.dx.video');
    };

    $.fn.owlCarousel.Constructor.Plugins.FitView = FitView;


    // $.fn.owlCarousel.Constructor.Plugins.Video5 = Video5;
    // $.fn.owlCarousel.Constructor.Plugins.RichMime = RichMime;
    
    var $carousel = $( '.owl-carousel' ).owlCarousel( {
        items: 1,
        merge: false,
        loop: true,
        lazyLoad: true,
        mergeFit: false,
        center: true,
        responsiveBaseElement: document.getElementById( 'carousels' )
    } );

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

    function Carousel ( options ) {
    }

    return Carousel;

});
