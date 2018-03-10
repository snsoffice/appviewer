define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Cover = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Cover, Showcase );

    Cover.prototype.open = function () {
    };

    Cover.prototype.close = function () {
    };

    return Cover;

} );
