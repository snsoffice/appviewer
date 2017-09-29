define( function () {

    var _online = navigator.onLine;    
    window.addEventListener( 'online', function () { _online = navigator.onLine; }, false );
    window.addEventListener( 'offline', function () { _online = navigator.onLine; }, false );

    return {

        online: _online,
        settings: {},
        layerIconPrefix: 'images/icons',

    }

} );
