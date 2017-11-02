define( [ 'ifuture' ],

function( ifuture ) {

    Navbar = function ( app, opt_options ) {
        ifuture.Component.call( this );

    }
    ifuture.inherits( Navbar, ifuture.Component );

    return Navbar;

} );
