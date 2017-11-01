define( [ 'config', 'ifuture', 'map', 'minimap', 'carousel', 'manager',
          'navbar', 'modebar', 'footbar', 'responsebar', 'dialog', 'communicator' ],

function( config, ifuture,
          Map, Minimap, Carousel, Manager,
          Navbar, Modebar, Footbar, Responsebar, Dialog, Communicator ) {

    Application = function () {
        ifuture.Component.call( this );

        this.navbar = new Navbar( this );
        this.map = new Map( this );
        this.minimap = new Minimap( this );
        this.modebar = new Modebar( this );
        this.footbar = new Footbar( this );

        this.manager = new Manager( this );
        this.carousel = new Carousel( this );

        this.dialog = new Dialog( this );
        this.communicator = new Communicator( this );
        this.responsebar = new Responsebar( this );
    };            
    ifuture.inherits( Application, ifuture.Component );

    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( component ) ? this[ name ] :
            this.manager.hasOwnProperty( name ) ? this.manager[ name ] :
            this.carousel.hasOwnProperty( name ) ? this.carousel[ name ] :
            null ;

        if ( component && component.hasOwnProperty( action ) && typeof component[ action ] === 'function' )
            return component[ action ].apply( component, arguments );

    };

    Application.prototype.init = function () {
    };

    Application.prototype.run = function () {
        // this.communicator.start();
    };

    return Application;

} );
