define( [ 'ifuture' ],

function( ifuture ) {

    Manager = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#manager' );
        this.element.querySelector( '.dx-taskbar' ).style.visibility = 'hidden';
        this.element.querySelector( '.dx-taskbar' ).addEventListener( 'click', Manager.prototype.handleClickTaskbar.bind( this ), false );

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
            component.on( [ 'task:close' ], function () {
                scope.toggle( false );
            } );
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
            if (  this.currentTask !== name && !! this.currentTask  )
                this.closePlugin();
            if ( this.openPlugin( name ) ) {
                this.currentTask = name;
                this.toggle( true );
            }
        }
        else {
            this.element.querySelector( '.dx-taskbar' ).style.visibility = 'visible';
            if ( !! this.currentTask )
                this.setTaskbar( this.currentTask );
            else
                this.setCurrentTask( this.element.querySelector( '.dx-taskbar > ul > li' ).getAttribute( 'data-plugin' ) );
            this.toggle( true );
        }
    }

    Manager.prototype.openPlugin = function ( name ) {

        if ( this.currentTask === name )
            return;

        var plugin = this.getPlugin( name );
        if ( !! plugin ) {
            plugin.create( this.element );
            return true;
        }

    };

    Manager.prototype.closePlugin = function ( name ) {
        Array.prototype.forEach.call( this.element.querySelectorAll( '.dx-toolcase' ), function ( task ) {
            task.remove();
        } );
        name = name ? name : this.currentTask;
        if ( !! name ) {
            var plugin = this.getPlugin( name );
            if ( plugin ) {
                plugin.close();
            }
        }
    };

    Manager.prototype.setTaskbar = function ( name ) {
        Array.prototype.forEach.call( this.element.querySelectorAll( '.dx-taskbar > ul > li' ), function ( task ) {
            task.className = '';
        } );
        this.element.querySelector( '.dx-taskbar > ul > li[data-plugin="' + name + '"]' ).className = 'active';
    };

    Manager.prototype.setCurrentTask = function ( name ) {
        if ( this.openPlugin( name ) ) {
            this.currentTask = name;
            this.setTaskbar( name );
        }
    };

    Manager.prototype.handleClickTaskbar = function ( e ) {
        e.preventDefault();
        var target = e.target.tagName === 'LI' ? e.target : e.target.tagName === 'A' ? e.target.parentElement : null ;
        if ( !! target ) {
            var name = target.getAttribute( 'data-plugin' );
            if ( this.currentTask === name )
                return;
            this.closePlugin();
            this.setCurrentTask( name );
        }
        else
            this.toggle( false );
    };

    return Manager;

} );
