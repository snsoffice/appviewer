define( [ 'application', 'config', 'dxbase', 'plugins',
          'search', 'utils', 'user',
          'dashboard', 'toolbox', 'appbox', 'dxmap', 'overview', 'showcase' ],

function( Application, config, dxbase, plugins,
          search, utils,
          User, Dashboard, Toolbox, Appbox, Dxmap, Overview, Showcase ) {

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
        new Appbox().show();
        // new Toolbox().show();
    }, false );

    navbar.querySelector( '#navbar-search' ).addEventListener( 'click', function ( e ) {
        e.preventDefault();
    }, false );

    navbar.querySelector( '#navbar-message' ).addEventListener( 'click', function ( e ) {
        e.preventDefault();
    }, false );

    navbar.querySelector( '#navbar-user' ).addEventListener( 'click', function ( e ) {
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
    document.getElementById( 'close-overview' ).addEventListener( 'click', function () {
        overview.close();
    }, false );
    document.getElementById( 'toggle-overview' ).addEventListener( 'click', function () {
        overview.toggle();
    }, false );
    document.addEventListener( 'toggle-overview', function () {
        document.querySelector( '#toggle-overview > i.fa' ).className = 'fa fa-angle-double-' + ( overview.visible ? 'right' : 'left' );
    }, false );
    document.getElementById( 'manage-thumbnail' ).addEventListener( 'click', function ( e ) {
        e.preventDefault();
        // overview.showThumbnail();
    }, false );

    //
    // showcase
    //
    showcase = new Showcase( {
        target: 'showcase',
    } );
    overview.on( 'item:open', showcase.openItem );
    overview.on( 'item:show', showcase.showFeature );
    document.getElementById( 'toggle-showcase' ).addEventListener( 'click', function () {
        showcase.toggle();
    }, false );
    document.getElementById( 'close-showcase' ).addEventListener( 'click', function () {
        showcase.close();
    }, false );
    document.addEventListener( 'toggle-showcase', function () {
        if ( showcase.visible )
            overview.toggle( showcase.mini );
    }, false );


    //
    // Remove splash
    //
    window.setTimeout( function ( ) {
        document.getElementById( 'splash' ).remove();
    }, 3000 );

    var app = new Application( config );

    // Create showcase plugins
    plugins.showcase.forEach( function ( showcase ) {
        app.carousel.create( app, showcase );
    } );

    // Create toolcase plugins
    plugins.toolcase.forEach( function ( toolcase ) {
        app.manager.create( app, toolcase );
    } );

    app.run();

} );
