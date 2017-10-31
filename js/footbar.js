define( [ 'dxbase' ],

function( dxbase ) {

    Footbar = function ( app, opt_options ) {

        dxbase.Component.call( this );

        var element = document.getElementById( 'footbar' );
        this.element = element;

        element.querySelector( '#footbar-maylayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'maylayer', 'show' );
        }, false );

        element.querySelector( '#footbar-carousel' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'carousel', 'show' );
        }, false );

        element.querySelector( '#footbar-minimap' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'minimap', 'show' );
        }, false );

    }
    dxbase.inherits( Footbar, dxbase.Component );

    Footbar.prototype.add = function ( name, title, icon, callback ) {
    };

    Footbar.prototype.remove = function ( name ) {
    };

    return Footbar;

} );

