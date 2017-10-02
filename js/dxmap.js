define( [ 'ol', 'db', 'overview', 'utils' ], function ( ol, db, Overview, utils ) {

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
                    imagerySet: 'AerialWithLabels',
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

            return new ol.layer.Tile( {
                source: new ol.source.Stamen( {
                    layer: 'watercolor'
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

    };


    var _featureLoader = function ( extent, resolution, projection ) {

        var source = this;
        var fmt = new ol.format.WKT();

        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmt.readFeature( item.geometry );
                if ( feature ) {
                    feature.setId( item.id );
                    feature.setProperties( { icon: item.icon, url: item.url }, true );
                    source.addFeature( feature );
                }
            } );
        } );

    };

    function createOverlay( map ) {

        var element = document.createElement( 'DIV' );
        element.style.textAlign = 'center';
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';
        // element.style.border = '2px solid #000';
        var img1 = document.createElement( 'IMG' );
        img1.src = utils.createVisualization();
        img1.style.opacity = 0.168;
        var img2 = document.createElement( 'IMG' );
        img2.src = 'images/marker.png';
        img2.width = 32;
        img2.height = 32;
        element.appendChild( img1 );
        element.appendChild( document.createElement( 'DIV' ) );
        element.appendChild( img2 );

        var marker = new ol.Overlay({
            element: element,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [ 0, -32 ]
        });
        map.addOverlay( marker );
        marker.setPosition( map.getView().getCenter() );

    }

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

    var defaultIconStyles = {};

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

    var createDefaultStyle = function ( feature ) {
        var icon = feature.get( 'icon' );
        if ( ! typeof icon === 'string' )
            return defaultStyle;
        var style = defaultIconStyles.get( icon );
        if ( style )
            return style;
        var url = 'images/icons/' + icon + '.png';
        style =  new ol.style.Style( {
            image: new ol.style.Icon( {
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                src: url
            } )
        } );
        defaultIconStyles[ icon ] = style;
        return style;
      };

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


    /**
     * @constructor
     * @extends {ol.interaction.Pointer}
     */
    var ClickAction = function() {

        ol.interaction.Pointer.call(this, {
          handleDownEvent: ClickAction.prototype.handleDownEvent
        });

        /**
         * @type {ol.Pixel}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.cursor_ = 'pointer';

        /**
         * @type {ol.Feature}
         * @private
         */
        this.feature_ = null;

        /**
         * @type {string|undefined}
         * @private
         */
        this.previousCursor_ = undefined;

    };
    ol.inherits( ClickAction, ol.interaction.Pointer );


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    ClickAction.prototype.handleDownEvent = function( evt ) {

        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel, function( feature, layer ) {
            var featuerLayer = layer;
            return feature;
        } );

        if ( feature ) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
        }

    };

    var _location = [ -251.03894817, 34.22705742 ];
    var _zoom = 10;
    var _distance = 40;
    var _baseLayer = _publicMap( 'stamen' );
    var _layer = new ol.layer.Vector( {
        source: new ol.source.Cluster( {
            distance: _distance,
            source: new ol.source.Vector( { loader: _featureLoader, } ),
        } ),
        style: styleFunction
      } );


    var _map = new ol.Map( {
        target: 'map',
        interactions: ol.interaction.defaults().extend( [ new ClickAction() ] ),
        controls: new ol.Collection(),
        layers: [ _baseLayer, _layer ],
        view: new ol.View( {
            center: ol.proj.fromLonLat( _location ),
            zoom: _zoom
        } )
    } );

    _baseLayer.once( 'postcompose', function ( e ) {
        document.getElementById( 'splash' ).remove();
    } );

    createOverlay( _map );

    var _ovmap = new Overview( _map );

    return Map( _map );

} );
