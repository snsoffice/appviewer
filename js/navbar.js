define( [ 'ifuture' ],

function( ifuture ) {

    Navbar = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var element = document.getElementById( 'navbar' );
        this.element = element;
        
        element.querySelector( '#show-toolbox' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'manager', 'show', 'toolbox' );
        }, false );

        element.querySelector( '#show-search' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'manager', 'show', 'search' );
        }, false );

        element.querySelector( '#show-talk' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'manager', 'show', 'talk' );
        }, false );

        element.querySelector( '#show-manager' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'manager', 'show' );
        }, false );

    }
    ifuture.inherits( Navbar, ifuture.Component );

    return Navbar;

} );
