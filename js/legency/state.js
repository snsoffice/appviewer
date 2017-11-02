define( function () {

    var _online = navigator.onLine;    
    window.addEventListener( 'online', function () { _online = navigator.onLine; }, false );
    window.addEventListener( 'offline', function () { _online = navigator.onLine; }, false );

    var _featureStack = [];

    return {

        online: _online,
        settings: {},
        featureStack: _featureStack,
    }

} );
