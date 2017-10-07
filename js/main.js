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
        target: 'map'
    } );


    //
    // overview
    //
    overview = new Overview( {
        map: map,
        target: 'overview'
    } );
    map.on( 'feature:click', overview.handleFeatureClicked );
    document.getElementById( 'toggle-overview' ).addEventListener( 'click', function ( e ) {
        overview.toggle();
    }, false );
    document.addEventListener( 'toggle-overview', function () {
        document.querySelector( '#toggle-overview > i.fa' ).className = 'fa fa-angle-double-' + ( overview.visible ? 'right' : 'left' );
    }, false );


    //
    // showcase
    //
    showcase = new Showcase( {
        target: 'showcase',
    } );
    map.on( 'feature:click', showcase.handleFeatureClicked );
    document.addEventListener( 'toggle-showcase', function () {
        if ( showcase.visible )
            overview.toggle( showcase.mini );
    }, false );
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
