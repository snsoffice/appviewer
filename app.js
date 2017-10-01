require.config( {

    baseUrl: 'js',

    paths: {
        ol: 'lib/ol-4.3.2/ol',
        easyrtc: 'lib/easyrtc.min',
        dexie: 'lib/dexie-1.5.1/dexie.min',
        three: 'lib/three.min',
        pannellum: 'lib/pannellum',
        libpannellum: 'lib/libpannellum',
        'socket.io': 'lib/socket.io.min',
    }

} );

requirejs( [ 'main' ] );
