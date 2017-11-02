define( [ 'ifuture' ],

function( ifuture ) {

    Manager = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#manager' );
        this.element.querySelector( '.dx-taskbar' ).style.visibility = 'hidden';
        this.element.querySelector( '.dx-titlebar' ).style.visibility = 'hidden';
        this.element.querySelector( '.dx-taskbar > button.close' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            this.toggle( false );
        }.bind( this ), false );
        this.element.querySelector( '.dx-titlebar > button.close' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            this.toggle( false );
        }.bind( this ), false );

        this.currentTask = null;
        this.plugins = {};
    }
    ifuture.inherits( Manager, ifuture.Component );

    Manager.prototype.addPlugin = function ( app, plugin ) {
        var scope = this;
        requirejs( [ plugin.source ], function ( Showcase ) {
            var component = Showcase( app, plugin.options );
            scope.plugins[ plugin.name ] = component;
        } );
    };

    Manager.prototype.hasPlugin = function ( name ) {
        return name in scope.plugins;
    };


    Manager.prototype.toggle = function ( visible ) {

        var element = this.element;
        this.visible = ( visible === true || visible === false ) ? visible : ! this.visible;
        element.style.visibility = this.visible ? 'visible' : 'hidden';

    };

    Manager.prototype.show = function ( name ) {
        if ( name === undefined ) {
            this.element.querySelector( '.dx-taskbar' ).style.visibility = 'visible';
            this.element.querySelector( '.dx-titlebar' ).style.visibility = 'hidden';
        }
        else {
            this.element.querySelector( '.dx-taskbar' ).style.visibility = 'hidden';
            this.element.querySelector( '.dx-titlebar' ).style.visibility = 'visible';
        }
        Array.prototype.forEach.call( this.element.querySelectorAll( '.dx-toolcase' ), function ( toolcase ) {
            toolcase.style.visibility = 'hidden';
        } );

        var tag = name ? name : this.currentTask;
        var toolcase = this.element.querySelector( selector );
        if ( toolcase )
            toolcase.style.visibility = 'visible';
        this.toggle( true );
    }
    
    return Manager;

} );
