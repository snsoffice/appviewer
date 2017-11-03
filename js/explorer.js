define( [ 'ifuture', 'carousel' ],

function( ifuture, Carousel ) {

    var Explorer = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#explorer' );

        var element = this.element.querySelector( '.dx-toolbar' );
        element.querySelector( '#swap-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            if ( this.element.className.indexOf( 'dx-mini') > -1 )
                this.element.className = 'dx-explorer dx-page';
            else
                this.element.className = 'dx-explorer dx-mini';
            this.resizeCarousel();
        }.bind( this ), false );
        element.querySelector( '#trash-showcase' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }, false );
        element.querySelector( '#hide-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            this.toggle( false );
        }.bind( this ), false );

        this.carousel = new Carousel( app, opt_options );

        this.plugins = {};
        this.viewname = null;
        this.items = [];
        this.item = undefined;
        this.mimetypes = [];

    }
    ifuture.inherits( Explorer, ifuture.Component );

    Explorer.prototype.addPlugin = function ( app, plugin ) {
        var scope = this;
        requirejs( [ plugin.source ], function ( Showcase ) {
            var component = new Showcase( app, plugin.options );
            scope.plugins[ plugin.name ] = component;
            if ( plugin.mimetyps )
                this.mimetyps.push( [ plugin.name, plugin.mimetypes ] );
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
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility == 'hidden';
        if ( visible )
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        element.style.visibility = visible ? 'visible' : 'hidden';
        if ( visible )
            this.resizeCarousel();

    };

    Explorer.prototype.resizeCarousel = function () {
        this.carousel.resize();
    };

    Explorer.prototype.show = function () {
        this.toggle( true );
    }

    Explorer.prototype.open = function ( item ) {
        var name = this.findView( item );
        if ( ! name )
            return;

        var container = document.createElement( 'DIV' );
        container.className = 'dx-showcase';
        this.element.appendChild( container );

        this.getPlugin( name ).open( container, item );
        this.viewname = name;
    };

    Explorer.prototype.close = function ( item ) {
        var plugin = this.getPlugin( this.viewname );
        // Replace carousel item with latest image
        var image = plugin.snap();
        plugin.close();
        this.element.querySelector( '.dx-showcase' ).remove();
        this.viewname = null;
    };

    Explorer.prototype.addItem = function ( item ) {
        var html =
            '<div data-name="' + item.name + '">' +
            '  <img class="owl-lazy" data-src="' + item.poster + '" alt="' + item.title + '">' +
            '</div>'
        var position = this.items.length;
        this.carousel.add( html, position );
        this.items.push( item );
    };

    Explorer.prototype.removeItem = function ( item ) {
    };


    Explorer.prototype.touchItem = function ( item ) {
        this.open( item );
    };

    Explorer.prototype.findView = function ( item ) {
        var mimetype = item.mimetype;
        for ( var i = 0; i < this.mimetypes.length; i ++ ) {
            var m = this.mimetypes[ 0 ];
            if ( m[1].indexOf( mimetype ) > -1 )
                return m[ 0 ];
        }
    };

    return Explorer;

} );
