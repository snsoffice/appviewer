define( [ 'ol', 'db', 'utils' ], function ( ol, db, utils ) {

    var featureLoader = function ( extent, resolution, projection ) {

        var source = this;
        var fmt = new ol.format.WKT();

        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmt.readFeature( item.geometry );
                if ( feature ) {
                    feature.setId( item.id );
                    feature.setProperties( {
                        category: item.category,
                        icon: item.icon,
                        url: item.url
                    }, true );
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

    var getDefaultStyle = function ( feature ) {
        var icon = feature.get( 'icon' );
        if ( ! typeof icon === 'string' )
            return defaultStyle;

        var style = defaultIconStyles[ icon ];
        if ( style instanceof ol.style.Style )
            return style;

        var url = 'images/icons/small/' + icon + '.png';
        style =  new ol.style.Style( {
            image: new ol.style.Icon( {
                crossOrigin: 'anonymous',
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

        // if ( resolution != currentResolution ) {
        //   calculateClusterInfo( resolution );
        //   currentResolution = resolution;
        // }

        var style;
        var size = feature.get( 'features' ).length;
        if ( size > 1 ) {
            style = new ol.style.Style( {
                image: new ol.style.Circle({
                    radius: 16, // feature.get( 'radius' ),
                    fill: new ol.style.Fill( {
                        color: [ 255, 153, 0, 0.8 ]
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
            style = getDefaultStyle( originalFeature );
        }

        return style;
      }

    function createClusterLayer() {
        var layer = new ol.layer.Vector( {
            source: new ol.source.Cluster( {
                distance: _distance,
                source: new ol.source.Vector( { loader: featureLoader, } ),
            } ),
            style: styleFunction
        } );
        return layer;
    }

    function loadLayer( url, callback ) {
        var request = new XMLHttpRequest();
        request.onerror = function ( event ) {
            utils.warning( '装载图层 ' + url + '时出现了错误!' );
        };

        request.onloadend = function() {

            if (request.status != 200) {
                utils.warning( '装载图层 ' + url + '失败，服务器返回代码：' + request.status );
                return;
            }
            callback( JSON.parse( request.responseText ) );
        };
        request.open('GET', url, true);
        request.send();
    }

    /**
     * @classdesc
     * Events emitted by {@link ol.Collection} instances are instances of this
     * type.
     *
     * @constructor
     * @extends {ol.events.Event}
     * @implements {oli.Collection.Event}
     * @param {ol.CollectionEventType} type Type.
     * @param {*=} opt_element Element.
     */
    var FeatureEvent = function( type, opt_feature ) {

        // ol.events.Event.call( this, type );
        this.propagationStopped = true;
        this.type = type;
        this.target = null;
        this.feature = opt_feature;

    };
    // ol.inherits( FeatureEvent, ol.events.Event );

    /**
     * @constructor
     * @extends {ol.interaction.Pointer}
     */
    var FeatureAction = function() {

        ol.interaction.Pointer.call(this, {
          handleDownEvent: FeatureAction.prototype.handleDownEvent
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
    ol.inherits( FeatureAction, ol.interaction.Pointer );


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    FeatureAction.prototype.handleDownEvent = function( evt ) {

        var map = evt.map;
        var selected = map.forEachFeatureAtPixel( evt.pixel, function ( feature, layer ) {
            return [ feature, layer ];
        } );

        if ( selected === undefined )
            return false;

        var feature = selected[ 0 ], layer = selected[ 1 ];

        if ( feature ) {

            this.coordinate_ = evt.coordinate;
            if ( layer.getSource() instanceof ol.source.Cluster ) {
                var features = feature.get( 'features' );
                var size = features.length;
                if ( size > 1 ) {
                    // TODO: 显示特征列表
                    return false;
                }
                this.feature_ = feature.get( 'features' )[0];
            }
            else
                this.feature_ = feature;

            var category = this.feature_.get( 'category' );

            if ( category === 'layer' ) {

                console.assert ( ! this.feature_.get( 'targetLayer' ) );

                var url = this.feature_.get( 'url' );

                // 发送 ajax request，读取 url 指定的 config
                loadLayer( url, function ( config ) {

                    var path = url.substring( 0, url.lastIndexOf( '/' ) );

                    // 创建 imageLayer
                    var imgLayer = new ol.layer.Image( {
                        source: new ol.source.ImageStatic( {
                            crossOrigin: 'anonymous',
                            imageExtent: config.extent,
                            url: path + '/' + ( config.image ? config.image : 'planform.png' ),
                        } ),
                    } );

                    // 创建 vectorLayer
                    var fmt = new ol.source.GeoJSON();
                    var features = fmt.readFeatures( {
                        type: 'FeatureCollection',
                        features: config.features,
                    } );
                    var layer = new ol.layer.Vector( {
                        source: new ol.source.Vector( {
                            features: features,
                        } ),
                    } );

                    var layer = new ol.layer.Group( {
                        opacity: config.opacity,
                        extent: config.extent,
                        minResolution: config.minResolution,
                        maxResolution: config.maxResolution,
                        zIndex: config.zIndex,
                        layers: [ imgLayer, layer ]
                    } );

                    this.feature_.set( 'targetLayer', layer, true );

                    map.addLayer( layer );

                    map.dispatchEvent( new FeatureEvent( 'feature:click', this.feature_ ) );

                }.bind( this ) );
            }

            else
                map.dispatchEvent( new FeatureEvent( 'feature:click', this.feature_ ) );

        }

        return false;

    };

    var _location = [ -251.03894817, 34.22705742 ];
    var _zoom = 10;
    var _distance = 40;

    function Map( options ) {

        var layer1 = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'watercolor'
        } );

        var layer2 = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'terrain-labels'
        } );

        var baseLayers = new ol.layer.Group( {
            layers: [ layer1 ]
        } );

        var span = document.createElement( 'SPAN' );
        span.className = 'fa fa-arrow-up';
        var rotate = new ol.control.Rotate( { label: span } );

        var map = new ol.Map( {
            target: options.target ? options.target : 'map',
            interactions: ol.interaction.defaults().extend( [ new FeatureAction() ] ),
            controls: [ rotate ],
            layers: [ baseLayers, createClusterLayer() ],
            view: new ol.View( {
                center: ol.proj.fromLonLat( _location ),
                zoom: _zoom
            } )
        } );

        this.map_ = map;
    }

    Map.prototype.on = function ( type, callback ) {
        this.map_.on( type, callback );
    }

    Map.prototype.getMap = function () {
        return this.map_;
    }

    Map.prototype.addItem = function ( item, parent ) {
        var config = item.config;
        var imgLayer = new ol.layer.Image( {
            source: new ol.source.ImageStatic( {
                crossOrigin: 'anonymous',
                imageExtent: config.extent,
                url: path + '/' + ( config.image ? config.image : 'planform.png' ),
            } ),
        } );
        var vecLayer = new ol.layer.Vector( {
            source: new ol.source.Vector( {
                features: features,
            } ),
        } );
        var group = new ol.layer.Group( {
            opacity: config.opacity,
            extent: config.extent,
            minResolution: config.minResolution,
            maxResolution: config.maxResolution,
            zIndex: config.zIndex,
            layers: [ imgLayer, vecLayer ]
        } );
        item.baseLayer = group;
        if ( parent instanceof ol.layer.Group ) {
            parent.getLayers().push( group );
            group.set( 'parent', parent, true );
        }
        else
            this.map_.addLayer( group );
        return group;
    };

    Map.prototype.removeItem = function ( item ) {
        var layer = item.baseLayer;
        var parent = layer.get( 'parent' );
        if ( parent )
            parent.getLayers().remove( layer );
        else
            this.map_.removeLayer( layer );
    };

    return Map;

} );
