define( [ 'ifuture' ],

function( ifuture ) {

    Footbar = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var element = document.getElementById( 'footbar' );
        this.element = element;

        element.querySelector( '#toggle-vision' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            // app.request( 'manager', 'show', 'maplayer' );
            app.request( 'vision', 'toggle' );
        }, false );

        element.querySelector( '#toggle-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'explorer', 'toggle' );
        }, false );

        element.querySelector( '#toggle-minimap' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'minimap', 'toggle' );
        }, false );

    }
    ifuture.inherits( Footbar, ifuture.Component );

    Footbar.prototype.add = function ( name, title, icon, callback ) {
    };

    Footbar.prototype.remove = function ( name ) {
    };

    return Footbar;

} );

