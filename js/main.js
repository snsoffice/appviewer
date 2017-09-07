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
        document.getElementById('splash').remove();
    });

    var navbar = document.getElementById('navbar');
    Array.prototype.forEach.call(navbar.getElementsByClassName('navbar-brand'), function (element) {
        element.addEventListener('mousedown', function (e) {
            document.getElementById('main-panel').style.display = 'block';
            e.stopPropagation();
            e.preventDefault();
        }, false);
    });

    var searchResults = document.createElement('UL');
    searchResults.className = 'list-group search-result-list';
    searchResults.style.display = 'none';
    searchResults.innerHTML = '<li class="list-group-item active">华清鱼汤</li>' +
        '<li class="list-group-item">西北大学新校区</li>' +
        '<li class="list-group-item">咸阳国际机场T2航站楼</li>';
    searchResults.addEventListener('mousedown', function (e) {
        searchResults.style.display = 'none';
        Array.prototype.forEach.call(
            searchResults.getElementsByClassName('list-group-item'),
            function (item) { item.className= 'list-group-item'; }
        );
        e.target.className += ' active';
    }, false);
    document.body.appendChild(searchResults);
    
    Array.prototype.forEach.call(navbar.getElementsByClassName('xs-search-form'), function (element) {
        element.addEventListener('mousedown', function (e) {
            if (document.hasFocus() && document.activeElement === e.target && searchResults.hasChildNodes() && searchResults.style.display === 'none') {
                searchResults.style.display = 'block';
                e.stopPropagation();
            }
        }, false);
    });

    var searchFeatures = function (name) {
        // Array.prototype.forEach.call(
        //     searchResults.getElementsByClassName('list-group-item'),
        //     function (item) { item.remove(); }
        // );
        // searchResults.innerHTML = '';
    };

    document.addEventListener('mousedown', function (e) {
        searchResults.style.display = 'none';
        document.getElementById('main-panel').style.display = 'none';
    }, false);
});
