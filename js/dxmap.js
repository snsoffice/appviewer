define( [ 'ol', 'db' ], function ( ol, db ) {

    var _publicMap = function ( vendor ) {

        if ( vendor === 'bings' ) {

            var styles = [
                'Road',
                'Aerial',
                'AerialWithLabels',
                'collinsBart',
                'ordnanceSurvey'
            ];

            return new ol.layer.Tile( {
                preload: Infinity,
                source: new ol.source.BingMaps( {
                    key: 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb',
                    imagerySet: 'Aerial',
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

        else if ( verder === 'osm' ) {

            return new ol.layer.Tile( {
                source: new ol.source.OSM()
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

    };


    var _featureLoader = function ( extent, resolution, projection ) {

        var source = this;
        var fmt = new ol.format.WKT();

        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmt.readFeature( item.gemoetry );
                if ( feature ) {
                    feature.setId( item.id );
                    feature.setProperties( { icon: item.icon, url: item.url }, true );
                    source.addFeature( feature );
                }
            } );
        } );

    };

    var spriteFill = new ol.style.Fill( {
        color: 'rgba(255, 153, 0, 0.8)'
    });
    var spriteStroke = new ol.style.Stroke( {
        color: 'rgba(255, 204, 0, 0.2)',
        width: 1
    } );
    var textFill = new ol.style.Fill( {
        color: '#fff'
    } );
    var textStroke = new ol.style.Stroke( {
        color: 'rgba(0, 0, 0, 0.6)',
        width: 3
    } );

    var createDefaultStyle = function ( feature ) {
        var radius = 20;
        return new ol.style.Style( {
          geometry: feature.getGeometry(),
          image: new ol.style.RegularShape( {
            radius1: radius,
            radius2: 3,
            points: 5,
            angle: Math.PI,
            fill: spriteFill,
            stroke: spriteStroke
          } )
        } );
      };

    var defaultStyle = new ol.style.Style( {
        image: new ol.style.RegularShape( {
            radius1: 20,
            radius2: 3,
            points: 5,
            angle: Math.PI,
            fill: spriteFill,
            stroke: spriteStroke
        } )
    } );

    var maxFeatureCount;
    function calculateClusterInfo( resolution ) {
        maxFeatureCount = 0;
        var features = _layer.getSource().getFeatures();
        var feature, radius;
        for ( var i = features.length - 1; i >= 0; --i ) {
          feature = features[ i ];
          var originalFeatures = feature.get( 'features' );
          var extent = ol.extent.createEmpty();
          var j, jj;
          for ( j = 0, jj = originalFeatures.length; j < jj; ++j ) {
            ol.extent.extend( extent, originalFeatures[ j ].getGeometry().getExtent());
          }
          maxFeatureCount = Math.max( maxFeatureCount, jj );
          radius = 0.25 * ( ol.extent.getWidth( extent ) + ol.extent.getHeight( extent ) ) / resolution;
          feature.set( 'radius', radius );
        }
      }

      var currentResolution;
      function styleFunction( feature, resolution ) {

        if ( resolution != currentResolution ) {
          calculateClusterInfo( resolution );
          currentResolution = resolution;
        }

        var style;
        var size = feature.get( 'features' ).length;
        if ( size > 1 ) {
            style = new ol.style.Style( {
                image: new ol.style.Circle({
                    radius: feature.get( 'radius' ),
                    fill: new ol.style.Fill( {
                        color: [ 255, 153, 0, Math.min( 0.8, 0.4 + ( size / maxFeatureCount ) ) ]
                    } )
                } ),
                text: new ol.style.Text( {
                    text: size.toString(),
                    fill: textFill,
                    stroke: textStroke
                } )
            } );

        } else {
            var originalFeature = feature.get( 'features' )[ 0 ];
            style = originalFeature.getStyle();
            if ( style === null )
                style = defaultStyle;
        }

        return style;
      }

    function Map( map ) {
        this.map = map;
    }

    Map.prototype.save = function () {}


    var _location = [ -251.03894817, 34.22705742 ];
    var _zoom = 8;
    var _distance = 40;
    var _baseLayer = _publicMap( 'gaode' );
    var _layer = new ol.layer.Vector( {
        source: new ol.source.Cluster( {
            distance: _distance,
            source: new ol.source.Vector( { loader: _featureLoader, } ),
        } ),
        style: styleFunction
      } );

    var _map = new ol.Map( {
        target: 'map',
        layers: [ _baseLayer, _layer ],
        view: new ol.View( {
            center: ol.proj.fromLonLat( _location ),
            zoom: _zoom
        } )
    } );

    _baseLayer.once( 'postcompose', function ( e ) {
        document.getElementById( 'splash' ).remove();
    } );

    return Map( _map );

} );
