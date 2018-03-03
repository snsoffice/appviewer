define( [ 'ifuture' ],

function( ifuture ) {

    Footbar = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var element = document.getElementById( 'footbar' );
        this.element = element;

        var me = this;

        element.querySelector( '#toggle-vision' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'vision', 'toggle' );
            me.toggle( e.currentTarget );
        }, false );

        element.querySelector( '#toggle-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'explorer', 'toggle' );
            var target = e.currentTarget;
            if ( target.getAttribute( 'data-toggle' ) === 'mini' )
                me.toggle( target );
        }, false );

        element.querySelector( '#toggle-minimap' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'minimap', 'toggle' );
            me.toggle( e.currentTarget );
        }, false );

    }
    ifuture.inherits( Footbar, ifuture.Component );

    Footbar.prototype.add = function ( name ) {
        this.toggle();
        this.element.querySelector( '#toggle-' + name ).setAttribute( 'data-toggle', 'mini' );
    };

    Footbar.prototype.remove = function ( name ) {
        this.element.querySelector( '#toggle-' + name ).setAttribute( 'data-toggle', 'button' );
    };

    Footbar.prototype.toggle = function ( element ) {
        Array.prototype.forEach.call( this.element.querySelectorAll( 'button[data-toggle="mini"]' ), function ( btn ) {
            if ( btn === element )
                btn.classList.toggle( 'active' );
            else
                btn.classList.remove( 'active' );
        } );
    };

    return Footbar;

} );
