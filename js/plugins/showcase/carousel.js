define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Carousel = function ( app, opt_options ) {
        Showcase.call( this );

        var element = document.createElement( 'DIV' );
        element.id = 'carousel';
        element.className = 'dx-showcase';
        element.innerHTML = '<div class="owl-carousel owl-theme"></div>';

    }
    ifuture.inherits( Carousel, Showcase );

    Carousel.prototype.open = function () {
    };

    Carousel.prototype.close = function () {
    };

    return Carousel;

} );
