define( [ 'ifuture', 'map', 'minimap', 'explorer', 'manager',
          'navbar', 'modebar', 'footbar', 'responsebar', 'dialog', 'communicator' ],

function( ifuture, Map, Minimap, Explorer, Manager,
          Navbar, Modebar, Footbar, Responsebar, Dialog, Communicator ) {

    Application = function ( opt_options ) {
        ifuture.Component.call( this );

        this.navbar = new Navbar( this, opt_options );
        this.map = new Map( this, opt_options );
        this.minimap = new Minimap( this, opt_options );
        this.modebar = new Modebar( this, opt_options );
        this.footbar = new Footbar( this, opt_options );

        this.explorer = new Explorer( this, opt_options );
        this.manager = new Manager( this, opt_options );

        this.dialog = new Dialog( this, opt_options );
        this.communicator = new Communicator( this, opt_options );
        this.responsebar = new Responsebar( this, opt_options );
    };
    ifuture.inherits( Application, ifuture.Component );

    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( name ) ? this[ name ] :
            this.manager.hasPlugin( name ) ? this.manager.getPlugin( name ) :
            this.explorer.hasPlugin( name ) ? this.explorer.getPlugin( name ) :
            null ;

        if ( component && typeof component[ action ] === 'function' ) {
            if ( !! arguments && ! ( arguments instanceof Array ) )
                arguments = [ arguments ];
            return component[ action ].apply( component, arguments );
        }

    };

    Application.prototype.run = function () {
        // this.communicator.start();

        // Debug        
        this.explorer.addItem( {
            name: 'chan',
            title: 'Chan',
            poster: 'data/html/images/chan.jpg',
            mimetype: 'image/jpeg',
            url: 'data/html/images/chan.jpg'
        } );
        this.explorer.addItem( {
            name: 'test1',
            title: 'Mountain and Lake',
            poster: 'data/html/test1.jpg',
            mimetype: 'panorama/equirectangular',
            url: 'data/html/examplepano.jpg'
        } );
        this.explorer.addItem( {
            name: 'test2',
            title: 'Ocean and bird',
            poster: 'data/html/test2.jpg',
            mimetype: 'video/mp4',
            url: 'data/html/oceans.webm'
        } );
        this.explorer.addItem( {
            name: 'test3',
            title: 'Beauty',
            poster: 'data/html/images/test3.jpg',
            mimetype: 'image/jpeg',
            url: 'data/html/images/guifei.jpg'
        } );
    };

    return Application;

} );
