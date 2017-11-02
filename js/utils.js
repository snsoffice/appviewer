define( function () {

    //
    // Message box
    //
    var _elementMessage = document.getElementById( 'message' );
    var _showMessage = function ( msg, className ) {
        _elementMessage.innerHTML = '<div class="alert alert-' + className + '" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            msg + '</div>';
        _elementMessage.style.display = 'block';
    };

    // document.addEventListener( 'click', function ( e ) {
    //     _elementMessage.style.display = 'none';
    // }, false );


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

        var vendor = options.vendor;

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

    return {

        warning: function ( msg ) {
            _showMessage( msg, 'warning' );
        },

        info: function ( msg ) {
            _showMessage( msg, 'info' );
        },

        createVisualization: _createVisualization,

        createPublicMap: _createPublicMap,
    }

} );
