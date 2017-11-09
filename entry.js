require.config( {

    baseUrl: 'js',

    paths: {
        jquery: 'lib/jquery.min',
        ol: 'lib/ol-4.3.2/ol',
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

requirejs( [ 'jquery', 'main' ] );
