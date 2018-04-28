define( [ 'application', 'config', 'ifuture', 'plugins' ],

function( Application, config, ifuture, plugins ) {

    //
    // map
    //
    // var map = new Dxmap( {
    //     target: 'map'
    // } );
    //

    // Remove splash    
    // window.setTimeout( function ( ) {
    //     document.querySelector( '.dx-splash' ).remove();
    // }, 3000 );

    //
    // navbar
    //
    // navbar = document.getElementById( 'navbar' );

    // navbar.querySelector( '.navbar-brand' ).addEventListener( 'click', function ( e ) {
    //     e.preventDefault();
    //     new Appbox().show();
    //     // new Toolbox().show();
    // }, false );

    // navbar.querySelector( '#show-search' ).addEventListener( 'click', function ( e ) {
    //     e.preventDefault();
    // }, false );

    // navbar.querySelector( '#show-message' ).addEventListener( 'click', function ( e ) {
    //     e.preventDefault();
    // }, false );

    // navbar.querySelector( '#show-user' ).addEventListener( 'click', function ( e ) {
    //     e.preventDefault();
    //     if ( dashboard === undefined )
    //         dashboard = new Dashboard();
    //     dashboard.show();
    // }, false );

    //
    // overview
    //
    // overview = new Overview( {
    //     map: map,
    //     target: 'overview'
    // } );
    // map.on( 'feature:click', overview.handleFeatureClicked );
    // document.getElementById( 'close-overview' ).addEventListener( 'click', function () {
    //     overview.close();
    // }, false );
    // document.getElementById( 'toggle-overview' ).addEventListener( 'click', function () {
    //     overview.toggle();
    // }, false );
    // document.addEventListener( 'toggle-overview', function () {
    //     document.querySelector( '#toggle-overview > i.fa' ).className = 'fa fa-angle-double-' + ( overview.visible ? 'right' : 'left' );
    // }, false );
    // document.getElementById( 'manage-thumbnail' ).addEventListener( 'click', function ( e ) {
    //     e.preventDefault();
    //     // overview.showThumbnail();
    // }, false );

    //
    // showcase
    //
    // showcase = new Showcase( {
    //     target: 'showcase',
    // } );
    // overview.on( 'item:open', showcase.openItem );
    // overview.on( 'item:show', showcase.showFeature );
    // document.getElementById( 'toggle-showcase' ).addEventListener( 'click', function () {
    //     showcase.toggle();
    // }, false );
    // document.getElementById( 'close-showcase' ).addEventListener( 'click', function () {
    //     showcase.close();
    // }, false );
    // document.addEventListener( 'toggle-showcase', function () {
    //     if ( showcase.visible )
    //         overview.toggle( showcase.mini );
    // }, false );

    // 删除原来的 map, 否则刷新的时候会出现两个 viewport
    document.getElementById( 'map' ).remove();
    var div = document.createElement( 'DIV' );
    div.innerHTML = '<div id="map" class="dx-map dx-page"></div>';
    document.body.appendChild( div.firstElementChild );

    var app = new Application( config );

    // Create showcase plugins
    plugins.showcase.forEach( function ( showcase ) {
        app.explorer.addPlugin( app, showcase );
    } );

    // Create toolcase plugins
    plugins.toolcase.forEach( function ( toolcase ) {
        app.manager.addPlugin( app, toolcase );
    } );

    // Bind menu event
    document.getElementById( 'start-living' ).addEventListener( 'click', function ( e ) {
        app.request( 'map', 'startBroadcast' );
        e.currentTarget.setAttribute( 'disabled', true );
    }, false );

    document.getElementById( 'join-living' ).addEventListener( 'click', function ( e ) {
        app.request( 'map', 'openLiving' );
    }, false );

    app.run();

} );
