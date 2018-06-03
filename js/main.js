define( [ 'application', 'config', 'plugins' ],

function( Application, config, plugins ) {

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

    app.run();

} );
