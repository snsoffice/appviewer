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

        this.element.querySelector( '.dx-taskbar' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            if ( e.target.tagName === 'LI' ) {
                var name = e.target.getAttribute( 'data-plugin' );
                if ( this.currentTask === name )
                    return;
                this.closePlugin();
                this.openPlugin( name );
            }
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
            var component = new Showcase( app, plugin.options );
            scope.plugins[ plugin.name ] = component;
            var title = component.title ? component.title : plugin.name;
            var li = document.createElement( 'LI' );
            li.setAttribute( 'data-plugin', plugin.name );
            li.innerHTML = '<a href="#">' + title + '</a>';
            scope.element.querySelector( '.dx-taskbar > ul' ).appendChild( li );
        } );
    };

    Manager.prototype.hasPlugin = function ( name ) {
        return name in this.plugins;
    };

    Manager.prototype.getPlugin = function ( name ) {
        return this.plugins[ name ];
    };


    Manager.prototype.toggle = function ( visible ) {

        var element = this.element;
        this.visible = ( visible === true || visible === false ) ? visible : ! this.visible;
        element.style.visibility = this.visible ? 'visible' : 'hidden';
        element.style.display = this.visible ? 'block' : 'none';

    };

    Manager.prototype.show = function ( name ) {
        if ( !! name ) {
            this.element.querySelector( '.dx-taskbar' ).style.visibility = 'hidden';
            this.element.querySelector( '.dx-titlebar' ).style.visibility = 'visible';
            if (  this.currentTask !== name && !! this.currentTask  )
                this.closePlugin();
            this.openPlugin( name );
            this.currentTask = name;
        }
        else {
            this.element.querySelector( '.dx-taskbar' ).style.visibility = 'visible';
            this.element.querySelector( '.dx-titlebar' ).style.visibility = 'hidden';
            if ( !! this.currentTask ) {
                name = this.element.querySelector( '.dx-taskbar > ul' ).firstElementChild.getAttribute( 'data-plugin' );
                this.openPlugin( name );
                this.currentTask = name;
            }
        }
        this.toggle( true );
    }

    Manager.prototype.openPlugin = function ( name ) {
        var plugin = this.getPlugin( name );
        if ( !! plugin ) {
            var div = plugin.create();
            if ( !! div ) {
                if ( div.className && div.className.indexOf( 'dx-toolcase' ) === -1 )
                    div.className += ' dx-toolcase';
                else
                    div.className = 'dx-toolcase';
                this.element.appendChild( div );                
            }
            this.element.querySelector( '.dx-titlebar > label' ).textContent = plugin.title;
        }
    };

    Manager.prototype.closePlugin = function ( name ) {
        name = name ? name : this.currentTask;
        if ( !! name ) {
            var plugin = this.getPlugin( name );
            if ( plugin ) {
                var toolcase = this.element.querySelector( '.dx-toolcase' );
                if ( toolcase )
                    toolcase.remove();
                plugin.close();
            }
        }
    };

    return Manager;

} );
