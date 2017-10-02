require.config( {

    baseUrl: 'js',

    paths: {
        jquery: 'lib/jquery.min',
        ol: 'lib/ol-4.3.2/ol',
        easyrtc: 'lib/easyrtc.min',
        dexie: 'lib/dexie-1.5.1/dexie.min',
        three: 'lib/three.min',
        pannellum: 'lib/pannellum',
        libpannellum: 'lib/libpannellum',
        owl: 'lib/owl.carousel.min',
        'socket.io': 'lib/socket.io.min',
    }

} );

requirejs( [ 'jquery', 'main' ] );
