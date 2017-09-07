require.config({
    paths: {
        ol: 'lib/ol-4.3.2/ol',
        dexie: 'lib/dexie-1.5.1/dexie'
    }
});

requirejs(['dexie', 'ol'], function(dexie, ol) {
    var location = [-251.03894817,  34.22705742];
    var zoom = 8;
    var layer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    var map = new ol.Map({
        target: 'map',
        layers: [ layer ],
        view: new ol.View({
            center: ol.proj.fromLonLat(location),
            zoom: zoom
        })
    });

    layer.once('postcompose', function (e) {
        var elements = document.getElementsByClassName('dx-splash');
        for (var i = 0; i < elements.length; i++)
            elements[i].remove();
    });
});
