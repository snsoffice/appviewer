define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Carousel = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Carousel, Showcase );

    Carousel.prototype.open = function () {
    };

    Carousel.prototype.close = function () {
    };

    return Carousel;

} );
