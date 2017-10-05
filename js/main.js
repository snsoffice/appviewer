define( [ 'search', 'utils', 'user',
          'dashboard', 'toolbox', 'dxmap', 'overview', 'showcase' ],

function( search, utils,
          User, Dashboard, Toolbox, Dxmap, Overview, Showcase ) {

    var navbar;
    var user;
    var dashboard;
    var map;
    var overview;
    var showcase;

    //
    // navbar
    //
    navbar = document.getElementById( 'navbar' );

    navbar.querySelector( '.navbar-brand' ).addEventListener( 'click', function ( e ) {
        e.preventDefault();
        new Toolbox().show();
    }, false );

    navbar.querySelector( '.dx-user' ).addEventListener( 'click', function ( e ) {
        e.preventDefault();
        if ( dashboard === undefined )
            dashboard = new Dashboard();
        dashboard.show();
    }, false );

    //
    // map
    //
    map = new Dxmap( {
        user: user,
        target: 'map'
    } );


    //
    // overview
    //
    overview = new Overview( {
        dxmap: map,
        target: 'overview'
    } );
    document.getElementById( 'toggle-overview' ).addEventListener( 'click', function ( e ) {
        var visible = overview.toggle();
        e.currentTarget.firstElementChild.className = 'fa fa-angle-double-' + ( visible ? 'right' : 'left' );
    }, false );


    //
    // showcase
    //
    showcase = new Showcase( {
        target: 'showcase',
    } );
    document.getElementById( 'manage-showcase' ).addEventListener( 'click', function ( e ) {
        showcase.showThumbnail();
    }, false );


    //
    // Remove splash
    //
    window.setTimeout( function ( ) {
        document.getElementById( 'splash' ).remove();
    }, 3000 );

} );
