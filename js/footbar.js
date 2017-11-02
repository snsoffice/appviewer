define( [ 'ifuture' ],

function( ifuture ) {

    Footbar = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var element = document.getElementById( 'footbar' );
        this.element = element;

        element.querySelector( '#show-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'manager', 'show', 'maplayer' );
        }, false );

        element.querySelector( '#show-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'explorer', 'show' );
        }, false );

        element.querySelector( '#show-minimap' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'minimap', 'show' );
        }, false );

    }
    ifuture.inherits( Footbar, ifuture.Component );

    Footbar.prototype.add = function ( name, title, icon, callback ) {
    };

    Footbar.prototype.remove = function ( name ) {
    };

    return Footbar;

} );

