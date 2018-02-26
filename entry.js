require.config( {

    baseUrl: 'js',

    paths: {
        jquery: 'lib/jquery-3.3.1.slim.min',
        popper: 'lib/popper.min',
        bootstrap: 'lib/bootstrap.min',
        fontawesome: 'lib/fontawesome-all.min',
        ol: 'lib/ol-v4.6.4/ol',
        easyrtc: 'lib/easyrtc',
        dexie: 'lib/dexie-1.5.1/dexie.min',
        three: 'lib/three.min',
        pannellum: 'lib/pannellum',
        libpannellum: 'lib/libpannellum',
        owl: 'lib/owl.carousel.min',
        videojs: 'lib/video.min',
        'socket.io': 'lib/socket.io.min',
    }

} );

requirejs.onError = function ( err ) {
    console.log( err.requireType );
    if ( err.requireType === 'timeout' ) {
        console.log( 'modules: ' + err.requireModules );
    }
    throw err;
};

requirejs( [ 'fontawesome', 'jquery', 'bootstrap', 'main' ] );
