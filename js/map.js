//
// 组织机构图层
//
//     views: stamen.? bings.? gaode
//            title layer
//            feature layer
//
//     explorer: ? 没有位置的图片或者文档
//
//     minimap: ?
//
define( [ 'ifuture', 'ol', 'db', 'utils', 'config', 'plugins/interaction/feature' ],

function( ifuture, ol, db, utils, config, FeatureInteraction ) {

    // Use EPSG:3857 as default projection

    // My home, east door of Greenland Centry Apartment
    var location = [ 12119628.52, 4055386.0 ];

    // The maximum resolution used to determine the resolution
    // constraint. It is used together with minResolution (or maxZoom) and
    // zoomFactor. If unspecified it is calculated in such a way that the
    // projection's validity extent fits in a 256x256 px tile. If the
    // projection is Spherical Mercator (the default) then maxResolution
    // defaults to 40075016.68557849 / 256 = 156543.03392804097
    var maxResolution = 156543.03392804097;

    // The minimum resolution used to determine the resolution
    // constraint. It is used together with maxResolution (or minZoom)
    // and zoomFactor. If unspecified it is calculated assuming 29
    // zoom levels (with a factor of 2). If the projection is
    // Spherical Mercator (the default) then minResolution defaults to
    // 40075016.68557849 / 256 / Math.pow(2, 28) =
    // 0.0005831682455839253.
    var minResolution = 0.0005831682455839253;

    var resolution = config.mapResolution;
    resolution = resolution ? resolution : 256;

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

    function createVisitorOverlay( name, src ) {

        var element = document.createElement( 'DIV' );
        element.style.textAlign = 'center';
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';
        // element.style.border = '2px solid #000';
        var img1 = document.createElement( 'IMG' );
        img1.src = utils.createVisualization();
        img1.style.opacity = 0.168;
        var img2 = document.createElement( 'IMG' );
        img2.src = src;
        img2.width = 32;
        img2.height = 32;
        element.appendChild( img1 );
        element.appendChild( document.createElement( 'DIV' ) );
        element.appendChild( img2 );

        var visitor = new ol.Overlay({
            id: name,
            element: element,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [ 0, -32 ]
        });
        return visitor;

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
                distance: config.clusterDistance,
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

    Map = function ( app, opt_options ) {
        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};

        var baseLayer = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'watercolor'
        } );
        var visionLayer = createClusterLayer();

        var span = document.createElement( 'SPAN' );
        span.innerHTML = '<i class="fas fa-long-arrow-alt-up"></i>';
        var rotate = new ol.control.Rotate( {
            className: 'rounded-circle ol-rotate',
            label: span,
        } );

        var featureInteraction = new FeatureInteraction( this );

        this.view = new ol.View( {
            center: location,
            resolution: resolution
        } );
        this.map = new ol.Map( {
            target: options.target ? options.target : 'map',
            interactions: ol.interaction.defaults().extend( [ featureInteraction ] ),
            controls: [ rotate ],
            layers: [ baseLayer, visionLayer ],
            view: this.view,
        } );

        this.map.addOverlay( createVisitorOverlay( 'visitor', 'images/marker.png' ) );
        this.map.addOverlay( createVisitorOverlay( 'camera', 'images/camera.png' ) );
        this._isVisitorVisible = false;
        this._isCameraVisible = false;

    }
    ifuture.inherits( Map, ifuture.Component );

    Map.prototype.getMap = function () {
        return this.map;
    };

    Map.prototype.addControl = function () {
    };

    Map.prototype.hiberate = function () {
    };

    Map.prototype.revive = function () {
    };

    return Map;

} );
