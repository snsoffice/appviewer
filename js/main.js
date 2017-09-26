requirejs(['dexie', 'ol', 'easyrtc', 'utils'], function(dexie, ol, easyrtc, utils) {

    document.addEventListener('look', function (e) {
        console.log('look'); 
    }, false);
    var evt = new Event("look", {"bubbles": false, "cancelable": false});
    document.dispatchEvent(evt);

    easyrtc.setSocketUrl("http://snsoffice.com:9090");
    // easyrtc.connect("yuanjing", function (rid, room) { showMessage('rid:' + rid + ', room is ' + room); }, function (e, msg) { showMessage('fail:' + msg); } );

    if (navigator.onLine) {
        console.log('online');
    } else {
        console.log('offline');
    }

    window.addEventListener('offline', function(e) {alert('offline');});
    window.addEventListener('online', function(e) {alert('online``');});

    window.localStorage.setItem('yuanjing_username', 'anonymous');
    window.localStorage.clear();

    var loadBingsMapLayers = function () {
        var center = ol.proj.fromLonLat([108.54, 34.16]); // Xi'an China
        var zoom = 8;
        var culture = 'zh-cn';
        if (typeof style === 'undefined')
            style = 'AerialWithLabels';

        var styles = [
            'Road',
            'Aerial',
            'AerialWithLabels',
            'collinsBart',
            'ordnanceSurvey'
        ];
        var layers = [];
        var i, ii;
        for (i = 0, ii = styles.length; i < ii; ++i) {
            layers.push(new ol.layer.Tile({
                visible: false,
                preload: Infinity,
                title: styles[i],
                source: new ol.source.BingMaps({
                    key: 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb',
                    imagerySet: styles[i],
                    culture: culture
                    // use maxZoom 19 to see stretched tiles instead of the BingMaps
                    // "no photos at this zoom level" tiles
                    // maxZoom: 19
                })
            }));
        }
    };

    var location = [-251.03894817,  34.22705742];
    var zoom = 8;
    var layer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    var bingLayer = new ol.layer.Tile({
        preload: Infinity,
        title: 'Aerial',
        source: new ol.source.BingMaps({
            key: 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb',
            imagerySet: 'Aerial',
            culture: 'zh-cn'
            // use maxZoom 19 to see stretched tiles instead of the BingMaps
            // "no photos at this zoom level" tiles
            // maxZoom: 19
        })
    });
    var gdLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            crossOrigin: 'anonymous',
            url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
        })
    });

    var bingChineseLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            crossOrigin: 'anonymous',
            tilePixelRatio: 2,
            tileUrlFunction: function(tileCoord){
                var z = tileCoord[0];
                var x = tileCoord[1];
                var y = -tileCoord[2] - 1;
                var result='', zIndex=0;

                for(; zIndex<z; zIndex++) {
                    result = ((x&1)+2*(y&1)).toString() + result;
                    x >>= 1;
                    y >>= 1;
                }
                return 'http://dynamic.t0.tiles.ditu.live.com/comp/ch/' + result + '?it=G,VE,BX,L,LA&mkt=zh-cn,syr&n=z&og=111&ur=CN';
            }
        })
    });

    layer = gdLayer;

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

    var navbar = document.getElementById( 'navbar' );

    Array.prototype.forEach.call( navbar.getElementsByClassName( 'navbar-brand' ), function ( element ) {
        element.addEventListener( 'click', function ( e ) {
            document.getElementById( 'dashboard' ).style.display = 'block';
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
                // e.stopPropagation();
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

    var dashboard = document.getElementById('dashboard');
    dashboard.firstElementChild.nextElementSibling.addEventListener('click', function (e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            var li = e.target.parentElement;
            if (li.className !== 'active') {
                Array.prototype.forEach.call(li.parentElement.querySelectorAll('ul > li'), function (item) {
                    item.className = '';
                    var tabname = item.getAttribute('tab-name');
                    dashboard.lastElementChild.querySelector(tabname).className = 'tab-pane';
                });
                li.className = 'active';
                var tabname = li.getAttribute('tab-name');
                dashboard.lastElementChild.querySelector(tabname).className += ' active';
            }
            // e.stopPropagation();
        }
    }, false);

    // dashboard.firstElementChild.nextElementSibling.addEventListener('click', function (e) {
    //     
    // });

    // document.getElementById('login').addEventListener('mousedown', function (e) {
    //     var request = new XMLHttpRequest();
    //     request.onerror = function ( event ) {
    //         alert( 'Error: ' + event.toString() );
    //     };

    //     request.onloadend = function() {

    //         if (request.status != 200) {
    //             alert( 'status is not 200, but ' + request.status);
    //             return;
    //         }

    //         alert ( 'Got response: ' + request.responseText);
    //     };
    //     var url = 'http://snsoffice.com:9098/house/applogin';
    //     request.open('GET', url, true);        
    //     request.send();
    //     e.stopPropagation();
    // }, false);

    document.addEventListener( 'click', function ( e ) {

        var tag = e.target.tagName;

        if ( ( ! ( tag === 'BUTTON' || tag === 'A' ) ) || ( e.target.className === 'close' ) )
            dashboard.style.display = 'none';

        if ( ! ( tag === 'INPUT' && e.target.name === 'search' ) )
             searchResults.style.display = 'none';

        document.getElementById( 'global-message' ).style.display = 'none';

    }, false);

});
