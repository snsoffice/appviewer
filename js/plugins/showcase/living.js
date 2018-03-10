define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Living = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Living, Showcase );

    Living.prototype.open = function () {
    };

    Living.prototype.close = function () {
    };

    return Living;

} );
