require.config( {

    baseUrl: 'js',

    paths: {
        ol: 'lib/ol-4.3.2/ol',
        easyrtc: 'lib/easyrtc',
        dexie: 'lib/dexie-1.5.1/dexie',
        three: 'lib/three.min',
        'socket.io': 'lib/socket.io.min',
    }

} );

requirejs( [ 'main' ] );
