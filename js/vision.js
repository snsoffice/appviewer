define( [ 'ifuture', 'carousel' ],

function( ifuture, Carousel ) {

    var Vision = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#vision' );

        var element = this.element.querySelector( '.dx-toolbar' );

        this.carousel = new Carousel( app, opt_options );

    }
    ifuture.inherits( Vision, ifuture.Component );

    Vision.prototype.toggle = function ( visible ) {

        var element = this.element;
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible )
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        element.style.visibility = visible ? 'visible' : 'hidden';
    };

    Vision.prototype.resizeCarousel = function () {
        this.carousel.resize();
    };

    Vision.prototype.show = function () {
        this.toggle( true );
    }

    return Vision;

} );
