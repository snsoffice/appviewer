require.config({
    baseUrl: 'js',
    paths: {
        ol: 'lib/ol-4.3.2/ol',
        dexie: 'lib/dexie-1.5.1/dexie'
    }
});

requirejs(['main']);
