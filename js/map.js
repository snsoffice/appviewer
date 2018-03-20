//
// 底图
//     watercolor: stamen.watercolor + stamen.toner-labels
//     aerial: bings.aerial + stamen.terrain-labels
//     road: gaode
//
// 组织机构图层
//
//     views: plan, stereo, solid
//            title layer
//            feature layer
//            children layer
//
//
//     explorer: 第一张是当前图层的标题，例如 远景网，华清御汤，二号院，二楼，201
//
//     minimap:
//
//       底图分为国家、省份、城市、区域四级
//       下面分别是 组织机构、建筑物、楼层、房间图层
//
// 大地图浏览模式（browser)
//
//     放大缩小, 拖曳移动地图中心
//     点击移动 visitor
//     点击特征图标，explorer 切换到对应的条目
//     点击子图层，进入到对应的图层
//
// 大地图导播模型（anchor）
//
//     点击移动 camera
//
// 大地图观看模式（viewer）
//
//    点击移动 visitor
//
// 大地图楼层模式（elevation），小模式
//
//    旋转拖曳切换楼层
//
//
// 默认视图
//
//     center
//     resolution
//
// 分辨率
//     世界 20000
//     中国 10000
//     省份  5000
//     城市  1200
//       县   600
//       区   300
//       镇   152
//     景点    76
//       村    38
//     小区    20    OSM 图层显示中文
//     街道     1    以上都是底图，下面都是自定义的图层
//
//     组织     1    这是组织机构平面图的打开之后分辨率
//   建筑物   0.1
//     房间  0.01
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
    var maxResolution = 100;

    // The minimum resolution used to determine the resolution
    // constraint. It is used together with maxResolution (or minZoom)
    // and zoomFactor. If unspecified it is calculated assuming 29
    // zoom levels (with a factor of 2). If the projection is
    // Spherical Mercator (the default) then minResolution defaults to
    // 40075016.68557849 / 256 / Math.pow(2, 28) =
    // 0.0005831682455839253.
    var minResolution = 0.01;

    var resolution = config.mapResolution;
    resolution = resolution ? resolution : 20;

    // 顶层视图的分辨率范围
    var topViewResolutions = [ 3000, 10000, 6000 ];

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
                        title: item.title,
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
            radius1: 16.2,
            radius2: 6.8,
            points: 5,
            opacity: 0.8,
            angle: Math.PI,
            fill: spriteFill,
            stroke: spriteStroke
        } )
    } );

    var getDefaultStyle = function ( feature ) {
        var icon = feature.get( 'icon' );
        if ( ! ( typeof icon === 'string' ) )
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
        var features = orglayer.getSource().getFeatures();
        var feature, radius;
        for ( var i = features.length - 1; i >= 0; --i ) {
          feature = features[ i ];
          var originalFeatures = feature.get( 'features' );
          var extent = ol.extent.createEmpty();
          var j, jj;
          for ( j = 0, jj = originalFeatures.length; j < jj; ++j ) {
            ol.extent.extend( extent, originalFeatures[ j ].getGeometry().getExtent());
          }
          maxFeatureCount = Math.max(maxFeatureCount, jj);
          radius = ( ol.extent.getWidth( extent ) + ol.extent.getHeight( extent ) ) / resolution;
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
        if ( size > 1 || resolution > topViewResolutions[ 0 ] ) {
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
            // style = getDefaultStyle( originalFeature );
            style = new ol.style.Style( {
                image: new ol.style.RegularShape( {
                    radius1: 16.2,
                    radius2: 6.8,
                    points: 5,
                    opacity: 0.8,
                    angle: Math.PI,
                    fill: spriteFill,
                    stroke: spriteStroke
                } ),
                text: new ol.style.Text( {
                    text: originalFeature.get( 'title' ),
                    scale: 2.0,
                    offsetY: 20,
                    padding: [ 2, 2, 2, 2 ],
                } )
            } );
        }

        return style;
      }

    var orglayer;
    function createClusterLayer() {
        orglayer = new ol.layer.Vector( {
            source: new ol.source.Cluster( {
                distance: config.clusterDistance,
                source: new ol.source.Vector( { loader: featureLoader, } ),
            } ),
            style: styleFunction
        } );
        return orglayer;
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

    function labelStyleFunction( feature, resolution ) {
        style = new ol.style.Style( {
            image: new ol.style.Circle( {
                radius: 2.6,
                opacity: 0.6,
                fill: spriteFill,
            } ),
            text: new ol.style.Text( {
                text: feature.get( 'title' ),
                scale: 2.0,
                offsetY: 20,
                padding: [ 2, 2, 2, 2 ],
            } )
        } );
        return style;
    }

    function childStyleFunction( feature, resolution ) {
        style = new ol.style.Style( {
            fill: new ol.style.Fill( {
                color: 'rgba(255, 255, 255, 0.1)',
            } ),
            stroke: new ol.style.Stroke( {
                color: 'rgba(0, 0, 255, 0.1)',
                width: 1,
            } ),
        } );
        return style;
    }

    function featureStyleFunction( feature, resolution ) {
        style = new ol.style.Style( {
            image: new ol.style.Circle( {
                radius: 5,
                fill: null,
                stroke: new ol.style.Stroke({color: 'orange', width: 2})
            } ),
        } );
        return style;
    }

    Map = function ( app, opt_options ) {
        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};

        // 保存 app
        this.app_ = app;

        /**
         * view mode: summary, browser, viewer
         */
        this.viewMode = 'summary';

        /**
         * minor mode: elevation, anchor
         */
        this.minorModes = [];

        // 当前图层的组织级别，0 表示组织机构， -1 表示没有组织机构被打开
        this.currentLevel_ = -1;

        // 所有打开的组织机构、建筑物、楼层、房间号的编号
        this.levels_ = [];

        // 平面图
        this.planGroup = new ol.layer.Group( {
            minResolution: 0.001,
            maxResolution: 1,
            visible: false,
        } );

        // 立体图
        this.stereoGroup = new ol.layer.Group( {
            minResolution: 0.001,
            maxResolution: 1,
            visible: false,
        } );

        // 三维图
        this.solidView = null;

        // 标题图层组
        this.labelGroup = new ol.layer.Group( {
            minResolution: 0.001,
            maxResolution: 1,
            visible: false,
        } );

        // 特征图层组
        this.featureGroup = new ol.layer.Group( {
            minResolution: 0.001,
            maxResolution: 1,
            visible: false,
        } );

        // 子图层组
        this.childrenGroup = new ol.layer.Group( {
            minResolution: 0.001,
            maxResolution: 1,
            visible: true,
        } );

        // 所有底图
        this.baselayers_ = {
            light: new ol.layer.Tile( {
                visible: true,
                maxResolution: maxResolution,
                minResolution: minResolution,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                } )
            } ),
            watercolor: new ol.layer.Tile( {
                visible: false,
                maxResolution: 26000,
                minResolution: minResolution,
                source: new ol.source.Stamen( {
                    layer: 'watercolor',
                    maxZoom: 14,
                } )
            } ),
            aerial: new ol.layer.Tile( {
                visible: false,
                preload: Infinity,
                maxResolution: 26000,
                minResolution: minResolution,
                source: new ol.source.BingMaps( {
                    key: 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb',
                    imagerySet: 'Aerial',
                    // imagerySet: 'AerialWithLabels',
                    // use maxZoom 19 to see stretched tiles instead of the BingMaps
                    // "no photos at this zoom level" tiles
                    maxZoom: 19
                } )
            } ),
            label: new ol.layer.Tile( {
                visible: true,
                maxResolution: 26000,
                minResolution: 1000,
                opacity: 0.6,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                } )
            } ),
        };

        // 底图图层
        this.baseGroup_ = new ol.layer.Group( {
            layers: [ this.baselayers_.watercolor, this.baselayers_.aerial, this.baselayers_.light, this.baselayers_.label ]
        } );

        // 组织机构图层
        var orgLayer = createClusterLayer();

        var span = document.createElement( 'SPAN' );
        span.innerHTML = '<i class="fas fa-long-arrow-alt-up"></i>';
        var rotate = new ol.control.Rotate( {
            className: 'rounded-circle ol-rotate',
            label: span,
        } );

        var attribution = new ol.control.Attribution( {
            className: 'd-flex flex-row-reverse btn-sm ol-attribution',
            collapsible: true,
            collapseLabel: '<',
        } );

        var featureInteraction = new FeatureInteraction( this );

        this.view = new ol.View( {
            center: location,
            minResolution: topViewResolutions[ 0 ],
            maxResolution: topViewResolutions[ 1 ],
            resolution: topViewResolutions[ 2 ],
        } );
        this.view2 = new ol.View( {
            minResolution: 1,
            maxResolution: maxResolution * 0.90,
            resolution: resolution,
        } );
        this.view3 = new ol.View( {
            minResolution: minResolution * 1.10,
            maxResolution: 1,
            resolution: resolution,
        } );
        this.map = new ol.Map( {
            target: options.target ? options.target : 'map',
            interactions: ol.interaction.defaults().extend( [ featureInteraction ] ),
            controls: [ rotate, attribution ],
            layers: [ this.baseGroup_, orgLayer, this.planGroup, this.stereoGroup, this.childrenGroup, this.labelGroup, this.featureGroup ],
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


    Map.prototype.setVisitor = function ( pos, angle ) {
        var visitor = this.map.getOverlayById( 'visitor' );
        var element = visitor.getElement();
        visitor.setPosition( pos );
        element.style.transform = 'rotate(' + angle + 'deg)';
    };

    /**
     * type: watercolor, aerial, road
     *
     */
    Map.prototype.setBaseMap = function ( type ) {
        if ( type === 'watercolor' ) {
            this.baselayers_.watercolor.setVisible( true );
            this.baselayers_.aerial.setVisible( false );
            this.baselayers_.light.setVisible( false );
        }

        else if ( type === 'aerial' ) {
            this.baselayers_.watercolor.setVisible( false );
            this.baselayers_.aerial.setVisible( true );
            this.baselayers_.light.setVisible( false );
        }

        else if ( type === 'standard' ) {
            this.baselayers_.watercolor.setVisible( false );
            this.baselayers_.aerial.setVisible( false );
            this.baselayers_.light.setVisible( true );
        }
    };

    /**
     * type: plan, stereo, solid
     *
     */
    Map.prototype.setVisionType = function ( type ) {
        if ( type === 'plan' ) {
            this.planGroup.setVisible( true );
            this.stereoGroup.setVisible( false );
            if ( this.solidView )
                this.solidView.setVisible( false );
        }
        else if ( type === 'stereo' ) {
            this.planGroup.setVisible( false );
            this.stereoGroup.setVisible( true );
            if ( this.solidView )
                this.solidView.setVisible( false );
        }
        else if ( type == 'solid' ) {
            if ( this.solidView ) {
                this.planGroup.setVisible( false );
                this.stereoGroup.setVisible( false );
                this.solidView.setVisible( true );
            }
        }
    };

    Map.prototype.setViewMode = function ( mode ) {

        if ( this.viewMode === mode )
            return;

        if ( mode === 'summary' ) {
            this.viewMode = mode;
            this.map.setView( this.view );
        }

        else if ( mode === 'browser' ) {
            this.viewMode = mode;
            this.map.setView( this.view2 );
        }

        else if ( mode === 'viewer' ) {
            this.viewMode = mode;
            this.map.setView( this.view3 );
        }

    };

    Map.prototype.toggleObject = function ( name ) {
        if ( name === 'title' ) {
            this.labelGroup.setVisible( ! this.labelGroup.getVisible() );
        }
        else if ( name === 'feature' ) {
            this.featureGroup.setVisible( ! this.featureGroup.getVisible() );
        }
        else if ( name === 'visitor' || name === 'camera' ) {
            var v = this.map.getOverlayById( name );
            var pos = v.getPosition();
            if ( pos === undefined ) {
                var pos = v.get( 'lastPosition' );
                v.setPosition( pos === undefined ? this.map.getView().getCenter() : pos );
            }
            else {
                v.set( 'lastPosition', pos );
                v.setPosition();
            }
        }
    };

    /**
     * 打开组织机构
     */
    Map.prototype.openFeature = function ( feature, level ) {
        var url = config.resourceBaseUrl + '/' + feature.get( 'url' ) + '/config.json';
        var request = new XMLHttpRequest();

        // request.onerror = function ( event ) {
        //     utils.warning( '读取特征数据 ' + url + '时出现了错误!' );
        // };

        request.onloadend = function() {
            if (request.status != 200) {
                utils.warning( '读取特征数据 ' + url + '失败，服务器返回代码：' + request.status );
                return;
            }
            var item = JSON.parse( request.responseText );
            if ( item.category === 'showcase' ) {
                this.openShowcase_( item, level );
            }
            else {
                this.openItem_( item, level );
            }
        }.bind( this );
        request.open( 'GET', url );
        request.send();

    };

    Map.prototype.closeLevel_ = function ( level ) {
        if ( level === undefined || level == -1)
            level = 0;
        for ( var i = this.levels_.length; i > level ; i ++ ) {
            this.planGroup.getLayers().pop();
            this.stereoGroup.getLayers().pop();
            this.labelGroup.getLayers().pop();
            this.featureGroup.getLayers().pop();
            this.childrenGroup.getLayers().pop();
        }
    };

    Map.prototype.translateExtent = function ( extent, origin ) {
        extent[ 0 ] += origin[ 0 ];
        extent[ 1 ] += origin[ 1 ];
        extent[ 2 ] += origin[ 0 ];
        extent[ 3 ] += origin[ 1 ];
    };

    // 打开一个组织机构层次的结点
    //     item 是配置文件
    //     level 是组织机构层次，level === undefined 或者 -1 表示增加的是组织机构
    //
    // 组织机构的层次：
    //     组织机构
    //     建筑物
    //     楼层
    //     房间
    //
    // item.name      名称标识符
    // item.origin    参考原点的坐标，所有的特征、图层等都是基于这个原点的
    Map.prototype.openItem_ = function ( item, level ) {

        this.setViewMode( 'viewer' );

        if ( level === undefined || level === -1 ) {
            // 组织机构已经打开
            if ( this.levels_.length > 0 && this.levels_[0].name === item.name ) {
                this.selectLevel_( 0 );
                return;
            }
            level = -1;
        }

        if ( level > -1 && this.levels_.length > level ) {
            if ( this.levels_[ level + 1 ].name === item.name ) {
                this.selectLevel_( level + 1 );
                return;
            }
        }

        this.closeLevel_( level );

        var origin = item.origin;
        var extent = item.extent;
        if ( extent === undefined ) {
            var view = this.map.getView();
            view.setCenter( origin );
            view.setResolution( 1 );
            extent = view.calculateExtent();
        }
        else {
            this.translateExtent( extent, origin );
        }

        // 设置当前
        level ++;
        this.levels_.push( {
            name: item.name,
            title: item.title,
            extent: extent,
            elevations: item.elevations,
        } );

        // 创建图层
        var layers = this.createItemLayers_( item );
        for ( var i = 0; i < layers.length; i ++ ) {
            layers[ i ].set( 'level', level, true );
        }

        this.planGroup.getLayers().push( layers[ 0 ] );
        this.stereoGroup.getLayers().push( layers[ 1 ] );
        this.labelGroup.getLayers().push( layers[ 2 ] );
        this.featureGroup.getLayers().push( layers[ 3 ] );
        this.childrenGroup.getLayers().push( layers[ 4 ] );

        // 设置当前 level
        this.selectLevel_( level );

        // 发出消息
        this.dispatchEvent( new ifuture.Event( 'feature:open', level ) );
        
    };

    // 返回五个 layer, 如果没有对应的图层数据，也返回一个空的 layer
    //     plan, stereo, label, feature, child
    Map.prototype.createItemLayers_ = function ( item ) {

        function createEmptyLayer() {
          return new ol.layer.Group();  
        };

        // 对于多层，在 selectLevel 的时候生成对应的图层
        if ( item.elevations !== undefined ) {
            return [ createEmptyLayer(), createEmptyLayer(),
                     createEmptyLayer(), createEmptyLayer(), createEmptyLayer() ];
        }

        var origin = item.origin;
        var extent = item.extent;
        if ( extent === undefined ) {
            extent = ol.extent.createEmpty();
        }
        else {
            this.translateExtent( extent, origin );
        }

        var features, source;
        var planlayer, stereolayer, labellayer, featurelayer, childlayer;

        if ( item.views === undefined ) {
            planlayer = createEmptyLayer();
            stereolayer = createEmptyLayer();
            labellayer = createEmptyLayer();
        }
        else {
            var plan = item.views.plan;
            if ( plan === undefined ) {
                planlayer = createEmptyLayer();
            }
            else {
                var imageExtent = plan.extent;
                this.translateExtent( imageExtent, origin );
                ol.extent.extend( extent, imageExtent );
                planlayer = new ol.layer.Image( {
                    visible: false,
                    minResolution: 0.001,
                    maxResolution: 1,
                    extent: extent,
                    source: new ol.source.ImageStatic( {
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent,
                        url: plan.url,
                    } )
                } );
            }

            var stereo = item.views.stereo;
            if ( stereo === undefined ) {
                stereolayer = createEmptyLayer();
            }
            else {
                var imageExtent = stereo.extent;
                this.translateExtent( imageExtent, origin );
                ol.extent.extend( extent, imageExtent );
                stereolayer = new ol.layer.Image( {
                    visible: false,
                    minResolution: 0.001,
                    maxResolution: 1,
                    extent: extent,
                    source: new ol.source.ImageStatic( {
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent,
                        url: stereo.url,
                    } )
                } );
            }

            var label = item.views.label;
            if ( label === undefined ) {
                labellayer = createEmptyLayer();
            }
            else {
                features = [];
                for ( var i = 0; i < label.length; i ++ ) {
                    var node = label[ i ];
                    var feature = fmt.readFeature( node.geometry );
                    if ( feature ) {
                        feature.set( title, node.text, true );
                        features.push( feature );
                    }
                }
                source = new ol.source.Vector( { features: features } );

                var labellayer = new ol.layer.Vector( {
                    extent: extent,
                    source: source,
                    style: labelStyleFunction,
                } );
            }
        }

        features = [];
        var fmt = new ol.format.WKT();
        if ( item.children ) {
            for ( var i = 0; i < item.children.length; i ++ ) {
                var node = item.children[ i ];
                var feature = fmt.readFeature( node.geometry );
                if ( feature ) {
                    var url = node.name;
                    feature.setProperties( {
                        category: 'house',
                        url: url
                    }, true );
                    features.push( feature );
                }
            }
        }
        source = new ol.source.Vector( { features: features } );
        var childlayer = new ol.layer.Vector( {
            extent: extent,
            source: source,
            style: childStyleFunction,
        } );

        features = [];
        if ( item.features ) {
            for ( var i = 0; i < item.features.length; i ++ ) {
                var node = item.features[ i ];
                var feature = fmt.readFeature( node.geometry );
                if ( feature ) {
                    feature.setProperties( {
                        category: 'showcase',
                        type: node.type,
                        pose: node.pose,
                        mimetype: node.type === 'panorama' ? 'panorama/equirectangular' : 'image/jpeg',
                        url: node.url,
                    }, true );
                    features.push( feature );
                }
            }
        }
        source = new ol.source.Vector( { features: features } );
        var featurelayer = new ol.layer.Vector( {
            extent: extent,
            source: source,
            style: featureStyleFunction,
        } );

        return [ planlayer, stereolayer, labellayer, featurelayer, childlayer ];
    };

    Map.prototype.selectLevel_ = function ( level ) {

        var item = this.levels_[ level ];
        this.currentLevel_ = level;

        // 隐藏楼层按钮
        if ( item.elevations === undefined ) {
            this.app_.request( 'modebar', 'setElevations', { elevations: [] } );
        }
        // 显示设置楼层按钮
        else {
            this.app_.request( 'modebar', 'setElevations', { elevations: item.elevations } );
        }

        // 装载最顶层的图层
        if ( item.elevations !== undefined && item.currentElevation === undefined ) {
            this.selectElevation_( level, item.elevations.length - 1 );
        }

        // 显示选中的图层
        else {
            var view = this.map.getView();
            view.fit( item.extent );

            // 创建旋转木马
            var layer = this.featureGroup.getLayers().item( level );
            this.createItemCarousel_( layer );
        }

    };

    Map.prototype.createItemCarousel_ = function ( layer ) {
        var title = layer === null ? '远景网' : layer.get( 'title' );
        var items = [ {
            type: 'cover',
            title: title === undefined ? '远景网' : title,
        } ];
        if ( layer instanceof ol.layer.Vector ) {
            layer.getSource().forEachFeature( function ( feature ) {
                var url = config.resourceBaseUrl + '/' + feature.get( 'url' );
                items.push( {
                    type: feature.get( 'type' ),
                    poster: url + '?imageslim',
                    mimetype: feature.get( 'mimetype' ),
                    url: url,
                    position: feature.getGeometry().getFirstCoordinate(),
                    pose: feature.get( 'pose' ),
                } );
            } );
        }
        this.app_.request( 'explorer', 'setItems', [ items ] );
    };

    Map.prototype.selectElevation_ = function ( level, elevation ) {
        var item = this.levels_[ level ];
        if ( item.currentElevation === elevation )
            return;

        var url = [ config.resourceBaseUrl ];
        for ( var i = 0; i < level ; i ++ )
            url.push( this.levels_[ i ].name );
        url.push( 'floor' + elevation + '/config.json' );

        var request = new XMLHttpRequest();

        request.onerror = function ( event ) {
            utils.warning( '读取楼层数据 ' + url.join( '/' ) + '时出现了错误!' );
        };

        request.onloadend = function() {
            if (request.status != 200) {
                utils.warning( '读取楼层数据 ' + url.join( '/' ) + '失败，服务器返回代码：' + request.status );
                return;
            }
            this.openElevation_( JSON.parse( request.responseText ), level );
            item.currentElevation = elevation;
        }.bind( this );
        request.open( 'GET', url.join( '/' ) );
        request.send();
    };

    Map.prototype.openElevation_ = function ( data, level ) {

        var layers = this.createItemLayers_( data );
        for ( var i = 0; i < layers.length; i ++ ) {
            layers[ i ].set( 'level', level, true );
        }

        this.planGroup.getLayers().pop();
        this.stereoGroup.getLayers().pop();
        this.labelGroup.getLayers().pop();
        this.featureGroup.getLayers().pop();
        this.childrenGroup.getLayers().pop();

        this.planGroup.getLayers().push( layers[ 0 ] );
        this.stereoGroup.getLayers().push( layers[ 1 ] );
        this.labelGroup.getLayers().push( layers[ 2 ] );
        this.featureGroup.getLayers().push( layers[ 3 ] );
        this.childrenGroup.getLayers().push( layers[ 4 ] );

    };

    Map.prototype.openShowcase_ = function ( data, level ) {

    };

    return Map;

} );
