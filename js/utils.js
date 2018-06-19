define( function () {

    var HOUSE_URL = 'house';
    var HOUSE_LIVING = 'living';

    var configFromURL = function () {

        var url;
        if (window.location.hash.length > 0) {
            // Prefered method since parameters aren't sent to server
            url = [window.location.hash.slice(1)];
        } else {
            url = decodeURI(window.location.href).split('?');
            url.shift();
        }
        if (url.length < 1) {
            return {};
        }
        url = url[0].split('&');

        var options = {};
        for (var i = 0; i < url.length; i++) {
            var name = url[i].split('=')[0];
            var value = url[i].split('=')[1];
            switch(name) {
                // configFromURL[ name ] = decodeURIComponent(value);
                // configFromURL[ name ] = Number(value);
                // configFromURL[ name ] = JSON.parse(value);
            case HOUSE_URL: case HOUSE_LIVING:
                options[ name ] = decodeURIComponent(value);
                break;
            default:
                console.log('An invalid configuration parameter was specified: ' + name);
                break;
            }
        }
        return options;

    };

    //
    // 消息框
    //
    var msglist = null;

    var _clearMessage = function ( e ) {

        if ( msglist !== null && e.target.className !== 'dropdown-item' ) {
            var element = document.getElementById( 'messagebox' );
            element.remove();
            msglist = [];
            document.removeEventListener( 'click', _clearMessage, false );
        }

    };
    var _showMessage = function ( msg, className ) {

        var element = document.getElementById( 'messagebox' );
        if ( ! element ) {
            element = document.createElement( 'DIV' );
            element.id = 'messagebox';
            element.className = 'dx-messagebox';
            document.body.appendChild( element );
            msglist = [];
            document.addEventListener( 'click', _clearMessage, false );
        }

        msglist.push( msg );
        element.innerHTML = '<div class="alert alert-' + className + ' fade show" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            msglist.join( '<p>' ) + '</div>';

    };

    //
    // Map Visualization
    //
    function _createVisualization( angle, distance ) {
        var angle = ( angle === undefined ? 45 : angle ) / 180 * Math.PI;
        var distance = distance === undefined ? 100 : distance;
        var color = '#ff1493';
        var opacity = 0.20;

        var canvas = document.createElement( 'CANVAS' );
        var ctx = canvas.getContext('2d');

        var t = Math.tan( angle / 2.0 );
        var x = parseInt( distance * t ), y = 0;
        var xm = x, ym = parseInt( distance * 1.1 );
        var x1 = 0, y1 = - distance;
        var x2 = x + x, y2 = - distance;
        var sx = 2.381, sy = 0.81;

        canvas.width = x2 * sx;
        canvas.height = ym * sy;

        ctx.save();
        ctx.fillStyle = color;
        ctx.scale( sx, sy );
        ctx.translate( 0,  ym );

        ctx.moveTo( x, y );
        ctx.quadraticCurveTo( x1, y1, xm, - ym );
        ctx.quadraticCurveTo( x2, y2, x, y );

        ctx.fill();
        ctx.restore();

        return canvas.toDataURL();
    }

    var _createPublicMap = function ( ol, options ) {

        var vendor = options === undefined ? null : options.vendor;

        if ( vendor === 'bings' ) {

            var styles = [
                'Road',
                'Aerial',
                'AerialWithLabels',
                'collinsBart',
                'ordnanceSurvey'
            ];

            var style = options.imagerySet ? options.imagerySet : 'AerialWithLabels';
            var key = options.key ? options.key : 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb';
            return new ol.layer.Tile( {
                preload: Infinity,
                source: new ol.source.BingMaps( {
                    key: key,
                    imagerySet: style,
                    // use maxZoom 19 to see stretched tiles instead of the BingMaps
                    // "no photos at this zoom level" tiles
                    maxZoom: 19
                } )
            } );

        }

        else if ( vendor === 'gaode' ) {

            return new ol.layer.Tile( {
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                } )
            } )

        }

        else if ( vendor === 'osm' ) {

            return new ol.layer.Tile( {
                source: new ol.source.OSM()
            } )

        }

        else if ( vendor === 'stamen' ) {

            // layer:  terrain, terrain-background, terrain-labels, terrain-lines,
            //         toner, toner-background, toner-labels, toner-lines, toner-hybrid, toner-lite
            //         watercolor
            var layer = options.layer ? options.layer : 'watercolor';
            return new ol.layer.Tile( {
                source: new ol.source.Stamen( {
                    layer: layer
                } )
            } )

        }

        else if ( vendor === 'cartodb' ) {

            // https://a.basemaps.cartocdn.com/rastertiles/voyager/6/19/23.png
            // https://b.basemaps.cartocdn.com/rastertiles/light_all/6/20/23.png
            // https://b.basemaps.cartocdn.com/rastertiles/dark_all/6/20/23.png
            // options: {
            //     urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            //     subdomains: ["a", "b", "c"]
            // }
            var layer = options.layer ? options.layer : 'light_all';
            return new ol.layer.Tile( {
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://{a-c}.basemaps.cartocdn.com/rastertiles/' + layer + '/{z}/{x}/{y}.png',
                } )
            } )

        }

        else if ( vendor === 'mapbox' ) {

            return new ol.layer.Tile({
                source: new ol.source.TileJSON({
                    url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
                    // url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
                    // url: 'https://api.tiles.mapbox.com/v3/mapbox.world-dark.json?secure',
                    // url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
                    crossOrigin: 'anonymous'
                }),
            });

        }

        else {

            // 中文 Bings Road
            return new ol.layer.Tile({
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    tilePixelRatio: 2,
                    tileUrlFunction: function( tileCoord ) {
                        var z = tileCoord[ 0 ];
                        var x = tileCoord[ 1 ];
                        var y = -tileCoord[ 2 ] - 1;
                        var result = '', zIndex = 0;
                        for( ; zIndex < z; zIndex ++ ) {
                            result = ( ( x & 1 ) + 2 * ( y & 1 ) ).toString() + result;
                            x >>= 1;
                            y >>= 1;
                        }
                        return 'http://dynamic.t0.tiles.ditu.live.com/comp/ch/' + result + '?it=G,VE,BX,L,LA&mkt=zh-cn,syr&n=z&og=111&ur=CN';
                    }
                } )
            } );

        }

    }

    var _formatUrl = function ( url, base ) {

        // 如果 url 是绝对地址，那么直接返回
        if ( url.startsWith( 'http://' ) || url.startsWith( 'https://' ) )
            return url;

        // 如果 url 没有包含 .. ，那么返回 base + url
        var result = base + '/' + url;
        var index = result.indexOf( '../' );
        if ( index === -1 )
            return result;

        // 替换 .. 为上级，返回一个合法的 url
        var parts = result.split( '/' );
        var i = 0;
        var n = parts.length;
        while ( i < n ) {
            if ( parts[ i ] === '..' ) {
                parts.splice( i - 1, 2 );
                i --;
                n --, n --;
            }
            else
                i ++;
        }

        return parts.join( '/' );

    };

    return {

        PARA_HOUSE_URL: HOUSE_URL,

        PARA_HOUSE_LIVING: HOUSE_LIVING,

        configFromURL: configFromURL,

        warning: function ( msg ) {
            _showMessage( msg, 'warning' );
        },

        info: function ( msg ) {
            _showMessage( msg, 'info' );
        },

        createVisualization: _createVisualization,

        createPublicMap: _createPublicMap,

        formatUrl: _formatUrl,
    }

} );
