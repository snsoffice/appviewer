/**
 *
 * 德新地图类定义，这是核心展示组件之一
 *
 * 概念和定义，对象名称首字母大写，属性全部小写，以下划线开头的是内部属性
 *
 *     Cluster
 *     Site
 *
 *     Basemap
 *     SiteLayer
 *
 *     sitestack
 *     sitelevel
 *
 *     plangroup
 *     solidgroup
 *     titlegroup
 *     childgroup
 *     scenegroup
 *
 *     map
 *     view
 *
 *     _clusterlayer
 *     _planlayer
 *     _solidlayer
 *     _titlelayer
 *     _childlayer
 *     _scenelayer
 *
 *     _threeview
 *
 *     _helper
 *         visitor
 *         anchor
 *
 *     _geolocation
 *
 *
 * 状态和模式
 *
 *     browse    浏览
 *     anchor    直播
 *     visit     观看直播等
 *     guide     导游
 *
 * 行为和方法，使用大小写混合方式定义名称
 *
 *     setRootSite
 *
 * 消息和事件
 *
 *
 * Site {
 *
 *     id
 *     title
 *
 * }
 *
 * SiteStack {
 *
 *     url, 可能是 undefined
 *
 *     site {
 *
 *         id
 *         title
 *
 *         elevations
 *
 *     }
 *
 *     center
 *     resolution
 *     extent
 *     maxzoom
 *     minzoom
 *
 *     elevation
 *
 * }
 *
 * 底图图层
 *      watercolor: stamen.watercolor + stamen.toner-labels
 *      aerial: bings.aerial + stamen.terrain-labels
 *      road: gaode
 *
 * 站点图层
 *
 *     views: plan, stereo, solid
 *            title layer
 *            scene layer
 *            child layer
 *
 * 大地图浏览模式（browse)
 *
 *     放大缩小, 拖曳移动地图中心
 *     点击移动 visitor
 *     点击特征图标，explorer 切换到对应的条目
 *     点击子图层，进入到对应的图层
 *
 * 大地图导播模型（anchor）
 *
 *     点击移动 anchor
 *
 * 大地图观看模式（visit）
 *
 *    点击移动 visitor
 *
 * 分辨率
 *     世界 20000
 *     中国 10000
 *     省份  5000
 *     城市  1200
 *       县   600
 *       区   300
 *       镇   152
 *     景点    76
 *       村    38
 *     小区    20    OSM 图层显示中文
 *     街道     1    以上都是底图，下面都是自定义的图层
 *
 *     组织     1    这是组织机构平面图的打开之后分辨率
 *   建筑物   0.1
 *     房间  0.01
 *
 * 游客视野
 *
 *     显示当前视野和位置，一般和旋转木马配合使用，显示对应照片的位置
 *     和拍摄角度
 *
 * 主播视野
 *
 *     显示直播摄像头的位置和视野
 */

define( [ 'ifuture', 'ol', 'db', 'utils', 'config',
          'plugins/interaction/feature',
          'plugins/interaction/dimension' ],

function( ifuture, ol, db, utils, config, FeatureInteraction, DimensionInteraction ) {

    var formatUrl = utils.formatUrl;
    var fmtwkt = new ol.format.WKT();

    // 默认坐标系 EPSG:3857

    // 绿地世纪城东门位置
    var defaultlocation = [ 12119628.52, 4055386.0 ];
    var defaultresolution = 6000;

    // 建筑物内部最大分辨率
    var SITE_MAX_RESOLUTION = 3.8;
    var SITE_MIN_RESOLUTION = 0.001;

    var CLUSTER_MIN_RESOLUTION = 1;
    var CLUSTER_DEFAULT_DISTANCE = 50;

    var BASEMAP_MIN_RESOLUTION = 0.1;
    var BASEMAP_MAX_RESOLUTION = 300;

    var FeatureType = {
        CLUSTER: 0,
        SITE: 1,
        FEATURE: 2,
        CHILD: 4,
    };

    //
    // 样式定义部分
    //

    // 颜色名称 https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
    var spritefill = new ol.style.Fill( {
        color: 'rgba(255, 153, 0, 0.8)'
    });
    var spritestroke = new ol.style.Stroke( {
        color: 'rgba(255, 204, 0, 0.2)',
        width: 1
    } );
    var textfill = new ol.style.Fill( {
        color: '#fff'
    } );
    var textstroke = new ol.style.Stroke( {
        color: 'rgba(0, 0, 0, 0.6)',
        width: 3
    } );

    //
    // 集簇样式
    //
    function calculateClusterInfo( feature, resolution ) {
        var features = feature.get( 'features' );
        var extent = ol.extent.createEmpty();
        for (var i = features.length - 1; i >= 0; --i) {
            ol.extent.extend( extent, features[ i ].getGeometry().getExtent() );
        }
        var radius = 0.25 * ( ol.extent.getWidth( extent ) + ol.extent.getHeight( extent ) ) / resolution;
        feature.set( 'radius', Math.max( 8.0, radius ) );
        feature.set( 'extent', extent );
    }

    var currentResolution;
    function clusterStyleFunction( feature, resolution ) {

        if ( resolution !== currentResolution ) {
            calculateClusterInfo( feature, resolution );
            currentResolution = resolution;
        }

        var style;
        var size = feature.get( 'features' ).length;
        var radius = feature.get( 'radius' );
        var opacity = Math.min( 0.6, 0.2 + ( size / 10 ) );

        if ( size > 1 ) {
            style = new ol.style.Style( {
                image: new ol.style.Circle({
                    radius: radius,
                    fill: new ol.style.Fill( {
                        color: [ 255, 153, 0, opacity ]
                    } )
                } ),
                text: new ol.style.Text( {
                    text: size > 100 ? '...' : size.toString(),
                    fill: textfill,
                } )
            } );

        }

        else {
            var orgfeature = feature.get( 'features' )[ 0 ];
            var title = orgfeature.get( 'title' );
            style = new ol.style.Style( {
                image: new ol.style.RegularShape( {
                    radius1: 16.2,
                    radius2: 6.8,
                    points: 5,
                    opacity: 0.8,
                    angle: Math.PI,
                    fill: spritefill,
                    stroke: spritestroke
                } ),
                text: new ol.style.Text( {
                    text: title,
                    scale: 2.0,
                    offsetY: 20,
                    padding: [ 2, 2, 2, 2 ],
                } )
            } );
        }

        return style;
    }

    function labelStyleFunction( feature, resolution ) {
        return new ol.style.Style( {
            image: new ol.style.Circle( {
                radius: 2.6,
                opacity: 0.6,
                fill: spritefill,
            } ),
            text: new ol.style.Text( {
                text: feature.get( 'title' ),
                scale: 2.0,
                offsetY: 20,
                padding: [ 2, 2, 2, 2 ],
            } )
        } );
    };

    var childstyle = new ol.style.Style( {
        fill: new ol.style.Fill( {
            color: 'rgba(255, 255, 255, 0.3)',
        } ),
        stroke: new ol.style.Stroke( {
            color: 'rgba(0, 0, 255, 0.3)',
            width: 1,
        } ),
    } );

    var featurestyle = new ol.style.Style( {
        image: new ol.style.Circle( {
            radius: 5,
            fill: new ol.style.Fill( { color: '#00bfff' } ),
        } ),
    } );


    //
    // 内部函数
    //

    function createVisitorOverlay( name, src ) {

        var element = document.createElement( 'DIV' );
        element.style.textAlign = 'center';
        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';
        element.style.transformOrigin = 'center 105px';
        // element.style.border = '1px solid #000';
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
            offset: [ 0, 16 ]
        });

        return visitor;

    }

    function emptyLayer() {
        return new ol.layer.Group( { visible: false } );
    }

    // 地图显示级别
    //
    // 集簇级，大范围，国家和省份，集簇方式显示组织机构
    // 区域级，小范围，城市，显示每一个组织机构
    // 站点级，显示一个组织机构或者景区
    // 楼房级，显示一个楼房或者楼层
    // 房间级，显示一个具体的房间
    //
    var ViewLevel = {
        CLUSTER: 0,
        REGION: 1,
        SITE: 2,
        BUILDING: 3,
        ROOM: 4,
    };

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

    //
    // 定位按钮
    //
    // 当前地图显示级别为集簇或者区域级，定位到地图的某一个位置
    //
    // 显示级别为组织级的时候，如果在组织机构内，那么定位到地图位置；
    // 如果不在组织机构内，地球切换到区域级进行显示
    //
    // 显示级别为楼房或者房间级，如果在当前建筑物内部，那么切换到对应
    // 的楼房或者房间；如果在组织机构内部，那么切换到组织机构级别；其
    // 他情况则切换到区域级别显示

    /**
     * @constructor
     * @extends {ol.control.Control}
     * @param {Object=} opt_options Control options.
     */
    var LocatorControl = function( opt_options ) {

        var options = opt_options || {};

        var button = document.createElement( 'BUTTON' );
        button.className = 'rounded-circle';
        button.innerHTML = '<i class="fas fa-map-marker"></i>';

        var scope = this;
        var handleClickLocator = function () {
            scope.getMap().getView().setRotation( 0 );
        };

        button.addEventListener( 'click', handleClickLocator, false );
        button.addEventListener( 'touchstart', handleClickLocator, false );

        var element = document.createElement( 'DIV' );
        element.className = 'ol-locator ol-unselectable ol-control';
        element.appendChild( button );

        ol.control.Control.call( this, {
            element: element,
            target: options.target
        } );

    };
    ol.inherits( LocatorControl, ol.control.Control );

    //
    // 罗盘按钮
    //
    // 在不支持陀螺仪或者指北针的设备上，当地图旋转之后出现，点击设置
    // 地图指向正北方向
    //
    // 在支持陀螺仪或者指北针的设备上，在定位模式下，地图自动旋转，始
    // 终指向正北方向，点击可以固定地图方向，再次点击则
    //
    // 非定位模式则仅当地图旋转之后出现，点击设置地图指向正北方向

    /**
     * @constructor
     * @extends {ol.control.Control}
     * @param {Object=} opt_options Control options.
     */
    var CompassControl = function( opt_options ) {

        var options = opt_options ? opt_options : {};
        options.className = 'rounded-circle ol-rotate';

        var span = document.createElement( 'SPAN' );
        span.innerHTML = '<i class="fas fa-long-arrow-alt-up"></i>';
        options.label = span;

        options.resetNorth = function () {
            var map = this.getMap();
            var view = map.getView();
            if (!view) {
                // the map does not have a view, so we can't act
                // upon it
                return;
            }
            if (view.getRotation() !== undefined) {
                if (this.duration_ > 0) {
                    view.animate({
                        rotation: 0,
                        duration: this.duration_,
                        easing: ol.easing.easeOut
                    });
                } else {
                    view.setRotation(0);
                }
            }
        }.bind( this );

        ol.control.Rotate.call( this, options );

        /**
         * @type {number}
         * @private
         */
        this.duration_ = options.duration !== undefined ? options.duration : 250;

    };
    ol.inherits( CompassControl, ol.control.Rotate );

    var Map = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};

        /**
         * @private
         * @type {ifuture.Application}
         */
        this.app_ = app;

        /**
         * @private
         * @type {enum} browse, anchor, visit, guide
         */
        this._majormode = 'browse';

        /**
         *
         * 当主模式为 anchor 的时候
         *
         *     false 表示还没有开始直播
         *     true  表示正在直播
         *
         * @private
         * @type {boolean}
         */
        this._isliving = false;

        /**
         *
         * 当前所有打开的站点堆栈
         *
         * @public
         * @type {SiteStack}
         */
        this.sitestack = [];

        /**
         * 当前地图的站点级别，默认是 -1，表示没有站点打开
         *
         * @public
         * @type {int}
         */
        this.stacklevel = -1;

        /**
         * 集簇图层
         *
         * @private
         * @type {ol.layer.Verctor}
         */
        this._clusterlayer = new ol.layer.Vector( {
            minResolution: CLUSTER_MIN_RESOLUTION,
            source: new ol.source.Cluster( {
                distance: CLUSTER_DEFAULT_DISTANCE,
                source: new ol.source.Vector(),
            } ),
            style: clusterStyleFunction,
        } );


        /**
         *
         * 平面图层组，立体图层组，标题图层组，特征图层组，子图层组
         *
         * @public
         * @type {ol.layer.Group}
         */
        this.plangroup = new ol.layer.Group();
        this.solidgroup = new ol.layer.Group();
        this.titlegroup = new ol.layer.Group();
        this.scenegroup = new ol.layer.Group();
        this.childgroup = new ol.layer.Group();


        this._planlayer = new ol.layer.Group( {
            layers: [ this.plangroup ],
            maxResolution: SITE_MAX_RESOLUTION,
            visible: true,
        } );

        this._solidlayer = new ol.layer.Group( {
            layers: [ this.solidgroup ],
            maxResolution: SITE_MAX_RESOLUTION,
            visible: false,
        } );

        this._titlelayer = new ol.layer.Group( {
            layers: [ this.titlegroup ],
            maxResolution: SITE_MAX_RESOLUTION,
            visible: true,
        } );

        this._scenelayer = new ol.layer.Group( {
            layers: [ this.scenegroup ],
            maxResolution: SITE_MAX_RESOLUTION,
            visible: false,
        } );

        this._childlayer = new ol.layer.Group( {
            layers: [ this.childgroup ],
            maxResolution: SITE_MAX_RESOLUTION,
            visible: true,
        } );

        /**
         * 三维图，显示当前组织机构内部对象的三维模型
         *
         * @public
         * @type {Solid}
         */
        this._threeview = null;

        /**
         * 所有使用到的底图图层的定义，这些都是公共地图
         * @private
         * @type {Object}
         */
        this._baselayers = {
            light: new ol.layer.Tile( {
                visible: true,
                maxResolution: BASEMAP_MAX_RESOLUTION * 1.6,
                minResolution: BASEMAP_MIN_RESOLUTION,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                } )
            } ),
            watercolor: new ol.layer.Tile( {
                visible: false,
                minResolution: BASEMAP_MIN_RESOLUTION,
                source: new ol.source.Stamen( {
                    layer: 'watercolor',
                    maxZoom: 14,
                } )
            } ),
            aerial: new ol.layer.Tile( {
                visible: false,
                preload: Infinity,
                minResolution: BASEMAP_MIN_RESOLUTION,
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
                minResolution: BASEMAP_MAX_RESOLUTION / 1.6,
                opacity: 0.6,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                } )
            } ),
        };

        /**
         * 底图图层组，所有用到的底图都在这个图层组里面
         *
         * @private
         * @type {ol.layer.Group}
         */
        this._basegroup = new ol.layer.Group( {
            layers: [ this._baselayers.watercolor, this._baselayers.aerial,
                      this._baselayers.light, this._baselayers.label ]
        } );

        this.view = new ol.View( {
            center: defaultlocation,
            resolution: defaultresolution,
            maxResolution: 20000,
        } );

        this.map = new ol.Map( {
            target: options.target ? options.target : 'map',
            interactions: ol.interaction.defaults().extend( [
                // new FeatureInteraction( this ),
                new DimensionInteraction( this ),
            ] ),
            controls: [
                new CompassControl(),
                new LocatorControl(),
            ],
            layers: [ this._basegroup, this._clusterlayer, this._childlayer,
                      this._planlayer, this._solidlayer, this._titlelayer, this._scenelayer,
                    ],
            view: this.view,
        } );

        var geolocation = new ol.Geolocation( {
            projection: this.view.getProjection()
        } );
        geolocation.on( 'change', function( evt ) {
            console.log( geolocation.getPosition() );
        } );

        geolocation.on( 'error', function () {
            // FIXME we should remove the coordinates in positions
            console.log( 'geolocation error' );
        } );

        this.map.on( 'postrender', this.onPostRender_, this );

        this.map.addOverlay( createVisitorOverlay( 'visitor', 'images/marker.png' ) );
        this.map.addOverlay( createVisitorOverlay( 'anchor', 'images/camera.png' ) );

        this.map.on( 'singleclick', this.handleSingleClick_, this );

    };
    ifuture.inherits( Map, ifuture.Component );

    Map.prototype.hiberate = function () {
    };

    Map.prototype.revive = function () {
        //
        // 调试语句，初始化集簇数据
        //
        var scope = this;
        var site = {
            id: 'root',
            title: '',
        };
        var features = [];
        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmtwkt.readFeature( item.geometry );
                if ( feature ) {
                    feature.setId( item.id );
                    feature.setProperties( {
                        type: FeatureType.SITE,
                        title: item.title,
                        url: formatUrl( item.url, config.resourceBaseUrl ),
                    }, true );
                    features.push( feature );
                }
            } );
            scope.setRootSite( site, features, {
                extent: [ 8313981.75, 2137428.08, 15554097.07, 7244644.56 ],
            } );
        } );
    };

    /**
     * 设置底图的显示方式，支持水彩、地形和交通三种
     *
     * @param {enum} type: watercolor, aerial, standard
     * @public
     */
    Map.prototype.setBaseMap = function ( type ) {
        if ( type === 'watercolor' ) {
            this._baselayers.watercolor.setVisible( true );
            this._baselayers.aerial.setVisible( false );
            this._baselayers.light.setVisible( false );
        }

        else if ( type === 'aerial' ) {
            this._baselayers.watercolor.setVisible( false );
            this._baselayers.aerial.setVisible( true );
            this._baselayers.light.setVisible( false );
        }

        else if ( type === 'standard' ) {
            this._baselayers.watercolor.setVisible( false );
            this._baselayers.aerial.setVisible( false );
            this._baselayers.light.setVisible( true );
        }
    };

    /**
     * 设置组织机构内部建筑物的显示方式，支持平面图、立体图和三维模型
     *
     * @param {enum} type: plan, stereo, solid
     * @public
     */
    Map.prototype.setVisionType = function ( type ) {
        if ( type === 'plan' ) {
            this._planlayer.setVisible( true );
            this._solidlayer.setVisible( false );
            if ( this._threeview )
                this._threeview.setVisible( false );
        }
        else if ( type === 'solid' ) {
            this._planlayer.setVisible( false );
            this._solidlayer.setVisible( true );
            if ( this._threeview )
                this._threeview.setVisible( false );
        }
        else if ( type == 'threed' ) {
            this._planlayer.setVisible( true );
            this._solidlayer.setVisible( false );
            if ( this._threeview ) {
                this._threeview.setVisible( true );
            }
            else {
                requirejs( [ 'solid' ], function ( Solid ) {
                    this._threeview = new Solid();
                }.bind( this ) );
            }
        }
    };

    /**
     * 设置地图内部组件是否可见，例如 标题，特征，游客和摄像头
     *
     * @param {enum} name: title, feature, visitor, camera
     * @public
     */
    Map.prototype.toggleVisible = function ( name, visible ) {
        if ( name === 'title' ) {
            this._titlelayer.setVisible( visible === undefined ? ! this._titlelayer.getVisible() : visible );
        }
        else if ( name === 'scene' ) {
            this._scenelayer.setVisible( visible === undefined ? ! this._scenelayer.getVisible() : visible );
        }
        else if ( name === 'visitor' || name === 'anchor' ) {
            var v = this.map.getOverlayById( name );
            var pos = v.getPosition();
            if ( ( pos === undefined && visible === undefined ) || visible === true ) {
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
     * 地图点击事件的处理函数
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     * @private
     */
    Map.prototype.handleSingleClick_ = function ( evt ) {
        var map = evt.map;
        var selected = map.forEachFeatureAtPixel( evt.pixel, function ( feature, layer ) {
            return [ feature, layer ];
        } );

        var feature, layer;
        if ( selected !== undefined ) {
            feature = selected[ 0 ];
            layer = selected[ 1 ];
        }

        return feature === undefined
            ? this.handleClickMapEvent_( evt )
            : this.handleClickFeatureEvent_( evt, feature, layer );

        return true;

    };

    /**
     * 地图点击事件的处理函数
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     * @param {ol.Feature|undefined} feature 当前点击的特征
     * @param {ol.Layer|undefined} layer 当前点击特征所在的图层
     *
     * @public
     */
    Map.prototype.handleClickEvent = function ( evt, feature, layer ) {

        return feature === undefined
            ? this.handleClickMapEvent_( evt )
            : this.handleClickFeatureEvent_( evt, feature, layer );

    };

    /**
     * 特征点击事件的处理:
     *
     *     如果是集簇，那么进入打开区域层
     *     如果是组织机构，那么打开组织机构
     *     如果是子图层，那么打开子图层
     *     如果特征，发出特征点击事件
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     * @param {ol.Feature|undefined} feature 当前点击的特征
     * @param {ol.Layer|undefined} layer 当前点击特征所在的图层
     *
     * @private
     */
    Map.prototype.handleClickFeatureEvent_ = function ( evt, feature, layer ) {

        if ( layer.getSource() instanceof ol.source.Cluster ) {

            this.popSiteStack_( this.sitelevel + 1 );

            var features = feature.get( 'features' );
            var size = features.length;

            if ( size > 1 ) {

                this.buildClusterView_( features );
                this.plangroup.getLayers().push( emptyLayer() );
                this.solidgroup.getLayers().push( emptyLayer() );
                this.titlegroup.getLayers().push( emptyLayer() );
                this.scenegroup.getLayers().push( emptyLayer() );
                this.childgroup.getLayers().push( emptyLayer() );

                this.selectSiteLevel_( this.sitestack.length - 1 );

                this.dispatchEvent( new ifuture.Event( 'site:changed' ) );
            }

            else {

                var orgfeature = features[ 0 ];
                this.openSite_( orgfeature.get( 'url' ), orgfeature.get( 'origin' ) );

            }

        }

        else {

            var type = feature.get( 'type' );

            if ( type === FeatureType.SITE || type === FeatureType.CHILD ) {
                this.openSite_( feature.get( 'url' ), feature.get( 'origin' ) );
            }

            else if ( type === FeatureType.SCENE ) {
                this.dispatchEvent( new ifuture.Event( 'scene:click', feature ) );
            }

        }
    };

    /**
     * 地图点击事件的处理，根据模式不同进行相应的操作
     *
     *     anchor: 切换 camera 的位置
     *     visit: 切换 visitor 的位置
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     *
     * @private
     */
    Map.prototype.handleClickMapEvent_ = function ( evt ) {

        var mode = this._majormode;

        if ( mode === 'anchor' ) {
            this.setVisionHelper( 'anchor', evt.coordinate );
        }

        else if ( mode === 'visit' ) {
            this.setVisionHelper( 'visitor', evt.coordinate );
        }

    };

    /**
     * 打开站点
     *
     * @param {string} url 指向组织机构的链接
     * @param {Array.<number>|undefined} origin 组织机构对应的原点
     * @private
     */
    Map.prototype.openSite_ = function ( url, origin ) {

        for ( var i = this.sitestack.length - 1; i > -1 ; i -- ) {
            if ( this.sitestack[ i ].url === url ) {
                this.selectSiteLevel_( i );
                return;
            }
        }

        var level = this.sitelevel;
        var request = new XMLHttpRequest();

        request.onloadend = function() {
            if (request.status != 200) {
                utils.warning( '读取数据 ' + url + '失败，服务器返回代码：' + request.status );
                return;
            }
            this.openItem_( url, JSON.parse( request.responseText ), level, origin );
        }.bind( this );

        request.open( 'GET', url + '/config.json' );
        request.send();

    };

    Map.prototype.translateExtent = function ( extent, origin ) {
        extent[ 0 ] += origin[ 0 ];
        extent[ 1 ] += origin[ 1 ];
        extent[ 2 ] += origin[ 0 ];
        extent[ 3 ] += origin[ 1 ];
    };

    Map.prototype.buildClusterView_ = function ( features ) {

        var extent = ol.extent.createEmpty();
        var j, jj;
        for ( j = 0, jj = features.length; j < jj; ++j ) {
            ol.extent.extend( extent, features[ j ].getGeometry().getExtent() );
        }

        jj = this.sitestack.length;
        for ( j = 0; j < jj; j ++ ) {
            if ( ! ol.extent.containsExtent( this.sitestack[ j ].extent, extent ) )
                break;
        }
        this.popSiteStack_( j );

        this.buildExtentView_( extent );

    };

    Map.prototype.buildExtentView_ = function ( extent ) {

        var resolution = this.view.getResolutionForExtent( extent );
        this.sitestack.push( {
            extent: extent,
            center: ol.extent.getCenter( extent ),
            resolution: resolution * 1.1,
        } );

    };

    /**
     * 打开一个组织机构层次的结点
     *     item 是配置文件
     *     level 是组织机构层次，level === undefined 或者 -1 表示增加的是组织机构
     *
     * 组织机构的层次：
     *     组织机构
     *     建筑物（楼层）
     *     房间
     *
     * @param {string} url 项目对应的 URL
     * @param {Object} item 项目对应的配置文件
     * @param {int} level 组织机构结点对应的图层级别
     *
     * item.name      名称标识符
     * item.origin    参考原点的坐标，所有的特征、图层等都是基于这个原点的
     */
    Map.prototype.openItem_ = function ( url, item, level, origin ) {

        level = level === undefined ? 0 : level + 1;
        console.assert( level < this.sitestack.length + 1 );

        this.popSiteStack_( level );

        if ( ! origin )
            origin = ! item.origin ? [ 0., 0. ] : item.origin;

        var extent;
        if ( item.extent === undefined )
            extent = this.view.calculateExtent();
        else {
            extent = item.extent;
            this.translateExtent( extent, origin );
        }

        this.buildExtentView_( extent );
        this.sitestack[ level ].url = url;
        this.sitestack[ level ].site = item;

        var layers = this.createItemLayers_( item, url, extent, origin );
        this.plangroup.getLayers().push( layers[ 0 ] );
        this.solidgroup.getLayers().push( layers[ 1 ] );
        this.titlegroup.getLayers().push( layers[ 2 ] );
        this.scenegroup.getLayers().push( layers[ 3 ] );
        this.childgroup.getLayers().push( layers[ 4 ] );

        // 装载最顶层的图层
        if ( item.elevations !== undefined )
            this.selectElevation_( level, item.elevations.length - 1 );
        else
            this.selectSiteLevel_( level );

        this.dispatchEvent( new ifuture.Event( 'site:changed' ) );

    };

    // 返回五个 layer, 如果没有对应的图层数据，也返回一个空的 layer
    //     plan, stereo, label, feature, child
    Map.prototype.createItemLayers_ = function ( item, baseurl, extent, origin ) {

        // 对于多层，在 selectLayerLevel 的时候生成对应的图层
        if ( item.elevations !== undefined ) {
            return [ emptyLayer(), emptyLayer(), emptyLayer(), emptyLayer(), emptyLayer() ];
        }

        var features, source;
        var planlayer, stereolayer, labellayer, featurelayer, childlayer;

        if ( item.views === undefined ) {
            planlayer = emptyLayer();
            stereolayer = emptyLayer();
            labellayer = emptyLayer();
        }
        else {
            var plan = item.views.plan;
            if ( plan === undefined ) {
                planlayer = emptyLayer();
            }
            else {
                var imageExtent = plan.extent;
                this.translateExtent( imageExtent, origin );
                ol.extent.extend( extent, imageExtent );
                planlayer = new ol.layer.Image( {
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    extent: extent,
                    source: new ol.source.ImageStatic( {
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent,
                        url: formatUrl( plan.url, baseurl ),
                    } )
                } );
            }

            var stereo = item.views.stereo;
            if ( stereo === undefined ) {
                stereolayer = emptyLayer();
            }
            else {
                var imageExtent = stereo.extent;
                this.translateExtent( imageExtent, origin );
                ol.extent.extend( extent, imageExtent );
                stereolayer = new ol.layer.Image( {
                    opacity: 0.8,
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    extent: extent,
                    source: new ol.source.ImageStatic( {
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent,
                        url: formatUrl( stereo.url, baseurl ),
                    } )
                } );
            }

            var label = item.views.label;
            if ( label === undefined ) {
                labellayer = emptyLayer();
            }
            else {
                features = [];
                for ( var i = 0; i < label.length; i ++ ) {
                    var node = label[ i ];
                    var feature = fmtwkt.readFeature( node.geometry );
                    if ( feature ) {
                        feature.getGeometry().translate( origin[ 0 ], origin[ 1 ] );
                        feature.set( 'title', node.text, true );
                        features.push( feature );
                    }
                }
                source = new ol.source.Vector( { features: features } );

                labellayer = new ol.layer.Vector( {
                    extent: extent,
                    source: source,
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    style: labelStyleFunction,
                } );
            }
        }

        features = [];
        if ( item.children ) {
            for ( var i = 0; i < item.children.length; i ++ ) {
                var node = item.children[ i ];
                var feature = fmtwkt.readFeature( node.geometry );
                if ( feature ) {
                    feature.getGeometry().translate( origin[ 0 ], origin[ 1 ] );
                    feature.setProperties( {
                        type: FeatureType.CHILD,
                        title: node.title,
                        url: formatUrl( node.name, baseurl ),
                        origin: node.origin,
                    }, true );
                    features.push( feature );
                }
            }
        }
        source = new ol.source.Vector( { features: features } );
        var childlayer = new ol.layer.Vector( {
            extent: extent,
            source: source,
            minResolution: SITE_MIN_RESOLUTION,
            maxResolution: SITE_MAX_RESOLUTION,
            style: childstyle,
        } );

        features = [];
        if ( item.features ) {
            for ( var i = 0; i < item.features.length; i ++ ) {
                var node = item.features[ i ];
                var feature = fmtwkt.readFeature( node.geometry );
                if ( feature ) {
                    feature.getGeometry().translate( origin[ 0 ], origin[ 1 ] );
                    feature.setProperties( {
                        type: FeatureType.FEATURE,
                        pose: node.pose,
                        mimetype: node.mimetype === 'panorama' ? 'panorama/equirectangular' : 'image/jpeg',
                        url: formatUrl( node.url, baseurl ),
                    }, true );
                    features.push( feature );
                }
            }
        }
        source = new ol.source.Vector( { features: features } );
        var featurelayer = new ol.layer.Vector( {
            extent: extent,
            source: source,
            minResolution: SITE_MIN_RESOLUTION,
            maxResolution: SITE_MAX_RESOLUTION,
            style: featurestyle,
        } );

        return [ planlayer, stereolayer, labellayer, featurelayer, childlayer ];
    };


    Map.prototype.createSiteCarousel_ = function ( level ) {

        level = level === undefined ? this.sitelevel : level;

        var items = [];

        if ( level < 0 || level > this.sitestack.length - 1 ) {

            items.push( {
                minetype: 'cover',
                title: '远景网',
            } );

        }

        else {

            var layer = this.scenegroup.getLayers().item( level );
            var title = this.sitestack[ level ].site === undefined ? '远景网' : this.sitestack[ level ].site.title;

            items.push( {
                minetype: 'cover',
                title: title === undefined ? '远景网' : title,
            } );

            if ( layer instanceof ol.layer.Vector ) {
                layer.getSource().forEachFeature( function ( feature ) {
                    var url = feature.get( 'url' );
                    items.push( {
                        poster: url + '?imageslim', // 这个请求在七牛是收费的
                        mimetype: feature.get( 'mimetype' ),
                        url: url,
                        position: feature.getGeometry().getFirstCoordinate(),
                        pose: feature.get( 'pose' ),
                    } );
                } );
            }
        }

        this.app_.request( 'explorer', 'setItems', [ items ] );
        this.toggleVisible( 'visitor', false );

    };

    Map.prototype.selectElevation_ = function ( level, elevation ) {

        if ( level < 0 || level >= this.sitestack.length )
            return;

        var v = this.sitestack[ level ];
        if ( v.elevation === elevation || v.site === undefined || v.site.elevations == undefined )
            return;

        this.popSiteStack_( level + 1 );

        var baseurl = v.url + '/floor' + elevation;
        var request = new XMLHttpRequest();

        request.onloadend = function() {

            if (request.status != 200) {
                utils.warning( '读取楼层数据 ' + baseurl + '失败，服务器返回代码：' + request.status );
                return;
            }

            this.openElevation_( JSON.parse( request.responseText ), baseurl, v.extent );
            v.elevation = elevation;

            if ( this.sitelevel === level )
                this.createSiteCarousel_( level );
            else
                this.selectSiteLevel_( level );

            this.dispatchEvent( new ifuture.Event( 'elevation:changed', { elevation: elevation, level: level } ) );

        }.bind( this );

        request.open( 'GET', baseurl + '/config.json' );
        request.send();

    };

    Map.prototype.openElevation_ = function ( data, baseurl, extent ) {

        var origin = ! data.origin ? [ 0, 0 ] : data.origin;
        var layers = this.createItemLayers_( data, baseurl, extent, origin );

        this.plangroup.getLayers().pop();
        this.solidgroup.getLayers().pop();
        this.titlegroup.getLayers().pop();
        this.scenegroup.getLayers().pop();
        this.childgroup.getLayers().pop();

        this.plangroup.getLayers().push( layers[ 0 ] );
        this.solidgroup.getLayers().push( layers[ 1 ] );
        this.titlegroup.getLayers().push( layers[ 2 ] );
        this.scenegroup.getLayers().push( layers[ 3 ] );
        this.childgroup.getLayers().push( layers[ 4 ] );

    };

    /**
     *
     * 设置地图的主模式，任何状态下地图必定处于某一个主模式下面
     *
     * @param {string} mode 模式名称，'browser', 'anchor', 'viewer'
     * @observable
     * @api
     */
    Map.prototype.setMajorMode = function ( mode ) {

        if ( this.majorMode_ === mode )
            return;

        if ( this.majorMode_ === 'anchor' ) {
            if( window.DeviceOrientationEvent ) {
                window.removeEventListener( 'deviceorientation', this.onCameraPoseChanged_, false );
            }
        }

        if ( mode === 'anchor' ) {

            if( window.DeviceOrientationEvent ) {
                window.addEventListener( 'deviceorientation', this.onCameraPoseChanged_, false );
            }
            else {
                console.log( '设备不支持指南针，无法显示摄像头的方向' );
            }

        }

        this.majorMode_ = mode;

    };


    /**
     *
     * 添加地图的小模式，多个小模式可以并存
     *
     * @param {string} mode 模式名称，'elevation'
     * @observable
     * @api
     */
    Map.prototype.addMinorMode = function ( mode ) {

    };

    /**
     *
     * 删除地图的小模式
     *
     * @param {string} mode 模式名称，'elevation'
     * @observable
     * @api
     */
    Map.prototype.removeMinorMode = function ( mode ) {

    };


    /**
     *
     * 设置游客或者摄像头的位置和视野，position 设置为 undefined 可以隐
     * 藏整个图标，yaw 设置为 undefined 可以隐藏视野角度，如果为 null
     * 则保持原来的值不变
     *
     * @param {string} name 名称，'visitor' 或者 'camera'
     * @param {ol.Coordinate|null} position 位置坐标，如果是 null 则不修改位置
     * @param {number} direction 视野方向，以正北为 0 度，顺时针为正
     * @observable
     * @api
     */
    Map.prototype.setVisionHelper = function ( name, position, direction ) {

        if (name === 'visitor' || name === 'camera') {

            var overlay = this.map.getOverlayById( name );

            if ( position !== null )
                overlay.setPosition( position );

            if ( direction === undefined ) {
                var element = overlay.getElement();
                element.querySelector( 'img:nth-of-type(2)' ).style.visiblility = 'hidden';
            }

            else if ( direction !== null ) {
                var element = overlay.getElement();
                element.querySelector( 'img:nth-of-type(2)' ).style.visiblility = 'visible';
                element.style.transform = 'rotate(' + direction + 'deg)';
            }

        }

    };

    /**
     *
     * 适应视图大小，并且使用动画方式过渡。首先是中心，然后在切换分辨率
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Map.prototype.fitView = function ( extent ) {

        if ( ol.extent.isEmpty( extent ) )
            return;

        var center = ol.extent.getCenter( extent );
        var resolution = this.view.getResolutionForExtent( extent );

        // var pt1 = this.map.getPixelFromCoordinate( center );
        // var pt2 = this.map.getPixelFromCoordinate( this.view.getCenter() );

        // // 计算中心移动的过渡时间
        // var dx = pt1[ 0 ] - pt2[ 0 ], dy = pt1[ 1 ] - pt2[ 1 ];
        // var duration1 = Math.sqrt( dx * dx + dy * dy ) * this.view.getResolution();

        // // 计算目标分辨率，根据当前分辨率确定过渡时间
        // var duration2 = this.view.getResolution() - resolution;

        this.view.animate( { center: center, duration: 500 },
                           { resolution: resolution, duration: 500 }
                         );

    };

    /**
     *
     * 直播模式下面自动设置摄像头的方向，根据手机指南针的方向
     *
     * @param {DeviceOrientationEvent} event 事件对象
     * @private
     *
     */
    Map.prototype.onCameraPoseChanged_ = function ( event ) {

        var heading = event.webkitCompassHeading;
        if ( heading === undefined )
            return;

        this.setVisionHelper( 'anchor', null, heading );

        if ( this.isLiving_ ) {
            // Send message to peer
        }

    };

    /**
     *
     * 开始直播
     *
     * @api
     *
     */
    Map.prototype.startBroadcast = function () {

        if ( this.majorMode_ === 'anchor' )
            return ;

        var roomName = this.getRoomName_();
        if ( ! roomName ) {
            return ;
        }

        this.setMajorMode( 'anchor' );
        this._isliving = false;

        this.app_.request( 'communicator', 'startBroadcast', roomName );
        this.app_.request( 'modebar', 'add', [ 'living', {
            name: 'living',
            title: '直播',
            icon: 'fas fa-video',
            menuitem: '结束直播',
            callback: this.stopBroadcast.bind( this ),
            exclusive: true,
        } ] );

    };

    /**
     *
     * 结束直播
     *
     * @api
     *
     */
    Map.prototype.stopBroadcast = function () {

        this.setMajorMode( 'browser' );
        this.isLiving_ = false;

        this.setVisionHelper( 'camera' );
        this.app_.request( 'communicator', 'stopBroadcast' );
        this.app_.request( 'modebar', 'remove', 'living' );
        document.getElementById( 'start-living' ).removeAttribute( 'disabled' );

    };

    /**
     *
     * 观看直播
     *
     * @api
     *
     */
    Map.prototype.getRoomName_ = function () {
        if ( this.layerLevel > -1 )
            return this.layerStack[ this.layerLevel ].url.slice( config.resourceBaseUrl.length + 1 ).replace( /\//g, '.' );
    };

    /**
     *
     * 观看直播
     *
     * @api
     *
     */
    Map.prototype.openLiving = function () {

        if ( this.majorMode_ !== 'browser' )
            return ;

        var roomName = this.getRoomName_();
        if ( ! roomName ) {
            return ;
        }

        this.app_.request( 'communicator', 'openLiving', roomName );

    };

    /**
     *
     * 关闭直播
     *
     * @api
     *
     */
    Map.prototype.closeLiving = function () {

        this.setMajorMode( 'browser' );

        this.setVisionHelper( 'camera' );
        this.app_.request( 'communicator', 'closeLiving' );

    };

    /**
     *
     * 绘制局部三维地图
     *
     * @private
     *
     */
    Map.prototype.onPostRender_ = function ( event ) {
        if ( this._threeview && this._threeview.isVisible() )
            this._threeview.render();
    };

    /**
     *
     * 添加站点到堆栈。
     *
     * @param {Object<id, title, url>} site
     * @private
     */
    Map.prototype.pushSiteStack_ = function ( site ) {
    };

    /**
     *
     * 弹出站点堆栈。
     *
     * 如果 level 是 undefined, 弹出最后一个, 否则弹出 level 指定的层。
     *
     * level = 0 会清空整个站点堆栈
     *
     * @param {int|undefined} level
     * @private
     */
    Map.prototype.popSiteStack_ = function ( level ) {

        var n = this.sitestack.length;
        var jj = Math.min( n, level === undefined ? 1 : n - level );

        for ( var i = 0; i < jj; i ++ ) {
            this.plangroup.getLayers().pop();
            this.solidgroup.getLayers().pop();
            this.titlegroup.getLayers().pop();
            this.scenegroup.getLayers().pop();
            this.childgroup.getLayers().pop();
            this.sitestack.pop();
        }

    };


    /**
     *
     * 设置当前级别站点的楼层数据。
     *
     * @param {int} level
     * @private
     */
    Map.prototype.setSiteElevations_ = function ( level ) {

        while ( level > -1 ) {

            var v = this.sitestack[ level ];

            if ( v.site && v.site.elevations !== undefined ) {

                this.app_.request( 'modebar', 'setElevations', {
                    data: v.site.elevations,
                    level: level,
                    callback: function ( level, elevation ) {
                        this.selectElevation_( level, elevation );
                        this.fitView( this.sitestack[ level ].extent );
                    }.bind( this ),
                } );

                this.dispatchEvent( new ifuture.Event( 'elevation:changed', {
                    elevation: v.elevation,
                    level: level
                } ) );

                break;

            }

            level --;

        }

        if ( level < 0 )
            this.app_.request( 'modebar', 'setElevations', {} );

    };

    /**
     *
     * 切换站点到堆栈的某一个层，-1 表示倒数第一个。
     *
     * @param {int} level
     * @private
     */
    Map.prototype.selectSiteLevel_ = function ( level ) {

        if ( this.sitelevel === level )
            return;

        var n = this.sitestack.length;
        if ( n == 0 ) {
            this.sitelevel = -1;
            return;
        }

        var index = Math.max( 0, level < 0 ? n + level : level );
        var v = this.sitestack[ index ];

        this.sitelevel = index;

        this.setSiteElevations_( index );

        this.createSiteCarousel_( index );

        this.fitView( v.extent );

    };

    /**
     *
     * 设置地图的根站点
     *
     * @param {Object<id, title>} site
     * @param {Array<ol.Feature>} features
     * @param {Object<extent, resolution, distance>} options
     * @observable
     * @api
     */

    Map.prototype.setRootSite = function ( site, features, options ) {

        this.popSiteStack_( 0 );

        var distance = options.distance === undefined ? CLUSTER_DEFAULT_DISTANCE : options.distance;
        this._clusterlayer.setSource(
            new ol.source.Cluster( {
                distance: distance,
                source: new ol.source.Vector( { features: features } ),
            } )
        );

        ( options && options.extent ) ? this.buildExtentView_( options.extent ) : this.buildClusterView_( features );
        this.plangroup.getLayers().push( emptyLayer() );
        this.solidgroup.getLayers().push( emptyLayer() );
        this.titlegroup.getLayers().push( emptyLayer() );
        this.scenegroup.getLayers().push( emptyLayer() );
        this.childgroup.getLayers().push( emptyLayer() );

        this.sitestack[ 0 ].site = site;
        this.selectSiteLevel_( 0 );

        this.dispatchEvent( new ifuture.Event( 'site:changed' ) );
    };


    /**
     *
     * 事件处理程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Map.prototype.handleFutureEvent = function ( event ) {

        if ( event.type === 'helper:changed' ) {
            var arg = event.argument;
            this.setVisionHelper( arg.name, arg.position, arg.yaw );
        }

        else if ( event.type === 'living:opened' ) {
            this.setMajorMode( 'viewer' );
        }

    };

    return Map;

} );
