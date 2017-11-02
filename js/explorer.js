define( [ 'ifuture' ],

function( ifuture ) {

    Explorer = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#explorer' );

        var element = this.element.querySelector( '.dx-toolbar' );
        element.querySelector( '#toggle-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            if ( this.element.className.indexOf( 'dx-mini') > -1 )
                this.element.className = 'dx-explorer dx-page';
            else
                this.element.className = 'dx-explorer dx-mini';
        }.bind( this ), false );
        element.querySelector( '#trash-showcase' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }, false );
        element.querySelector( '#hide-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            this.toggle( false );
        }.bind( this ), false );

        this.plugins = {};
        this.items = [];
    }
    ifuture.inherits( Explorer, ifuture.Component );

    Explorer.prototype.addPlugin = function ( app, plugin ) {
        var scope = this;
        requirejs( [ plugin.source ], function ( Showcase ) {
            var component = new Showcase( app, plugin.options );
            scope.plugins[ plugin.name ] = component;
        } );
    };

    Explorer.prototype.hasPlugin = function ( name ) {
        return name in this.plugins;
    };

    Explorer.prototype.getPlugin = function ( name ) {
        return this.plugins[ name ];
    };

    Explorer.prototype.toggle = function ( visible ) {

        var element = this.element;
        this.visible = ( visible === true || visible === false ) ? visible : ! this.visible;
        element.style.visibility = this.visible ? 'visible' : 'hidden';

    };

    Explorer.prototype.show = function () {
        Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
            mini.style.visibility = 'hidden';
        } );
        this.toggle( true );
    }

    Explorer.prototype.addItem = function ( item ) {
    };


    Explorer.prototype.touchItem = function ( item ) {
        // Open item if found plunin serving mimetype of item
    };

    return Explorer;

} );
