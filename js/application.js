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

        this.manager = new Manager( this, opt_options );
        this.explorer = new Explorer( this, opt_options );

        this.dialog = new Dialog( this, opt_options );
        this.communicator = new Communicator( this, opt_options );
        this.responsebar = new Responsebar( this, opt_options );
    };            
    ifuture.inherits( Application, ifuture.Component );

    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( name ) ? this[ name ] :
            this.manager.hasOwnProperty( name ) ? this.manager[ name ] :
            this.explorer.hasOwnProperty( name ) ? this.explorer[ name ] :
            null ;

        if ( component && typeof component[ action ] === 'function' )
            return component[ action ].apply( component, arguments );

    };

    Application.prototype.run = function () {
        // this.communicator.start();
    };

    return Application;

} );
