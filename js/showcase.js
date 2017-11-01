define( [ 'ifuture' ],

function( ifuture ) {

    Showcase = function ( app, opt_options ) {
        ifuture.Component.call( this );
    }
    ifuture.inherits( Showcase, ifuture.Component );

    Showcase.prototype.open = function ( feature ) {
    };

    Showcase.prototype.close = function () {
    };

    return Showcase;

} );
