define( [ 'config', 'dxbase', 'plugins', 'navbar' ],

function( config, dxbase, plugins, Navbar ) {

    //
    //
    //
    Application = function () {
        dxbase.Component.call( this );

        this.navbar = new Navbar( this );
        this.map = null;
        this.minimap = null;
        this.modebar = null;
        this.footbar = null;

        this.manager = null;
        this.carousel = null;

        this.dialog = null;
        this.communicator = null;
        this.responsebar = null;
    }
    dxbase.inherits( Application, dxbase.Component );

    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( component ) ? this[ name ] :
            this.manager.hasOwnProperty( name ) ? this.manager[ name ] :
            this.carousel.hasOwnProperty( name ) ? this.carousel[ name ] :
            null ;

        if ( component && component.hasOwnProperty( action ) && typeof component[ action ] === 'function' )
            return component[ action ].apply( component, arguments );

    }

    return Application;

} );
