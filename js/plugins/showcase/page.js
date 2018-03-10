define( [ 'ifuture', 'showcase' ],

function( ifuture, Showcase ) {

    Page = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Page, Showcase );

    Page.prototype.open = function () {
    };

    Page.prototype.close = function () {
    };

    return Page;

} );
