define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Photo = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Photo, Showcase );

    Photo.prototype.open = function () {
    };

    Photo.prototype.close = function () {
    };

    return Photo;

} );
