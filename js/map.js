/**
 *
 * 德新地图类定义，这是核心展示组件之一
 *
 * 概念和定义，对象名称首字母大写，属性全部小写，以下划线开头的是内部属性
 *
 *     Site
 *
 *     Basemap
 *     HouseLayer
 *
 *     housestack
 *     houselevel
 *
 *     planegroup
 *     solidgroup
 *     titlegroup
 *     childgroup
 *     scenegroup
 *
 *     map
 *     view
 *     source
 *
 *     _rootlayer
 *     _planelayer
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
 *     editor    新增房屋特征等
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
 *     id               house domain, member field: userid
 *     title            domain name, member field: fullname
 *     description      member field
 *     location         member field
 *
 *     ? portrait       member field
 *     ? home_page      member field
 *
 * }
 *
 * HouseStack {
 *
 *     title
 *     url
 *     type          portal_type
 *     description
 *
 *     metadata, 根据类型不同，包含的数据不同，
 *         house_area
 *         house_type
 *         house_location
 *
 *     collapsed boolean true 表示是下一级别的孩子结点是直接打开的，其他孩子结点都没有打开
 *                       undefined 或者 false 表示全部孩子结点都已经打开了
 *     extent
 *     center
 *     resolution
 *
 *     elevations
 *     currentElevation
 *
 * }
 *
 * 底图图层
 *
 *      watercolor: stamen.watercolor + stamen.toner-labels
 *      aerial: bings.aerial + stamen.terrain-labels
 *      road: gaode
 *
 * 房屋图层 HouseLayer
 *
 *     views: plane, solid, three
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
 * 大地图导播模式（anchor）
 *
 *     点击移动 anchor
 *
 * 大地图编辑模式（editor）
 *
 *     增加房屋特征（HouseFeature），或者修改特征的位置和角度等
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

define( [ 'ifuture', 'ol', 'db', 'utils', 'config' ],

function( ifuture, ol, db, utils, config ) {

    var CONFIG_FILE = function ( url ) {
        return  url + '/config.json?houseDomain=' + (config.houseDomain ? config.houseDomain : '');
    }

    var ROOT_SITE_RESOLUTION = 5000;
    var FUTURE_ROOT_SITE = {
        id: '',
        title: '远景网',
        description: '直播看房，远程观景，世界就在你眼中',

        // 地址
        locations: [ '中国', '陕西省', '西安市', '绿地中心A座6009' ],

        // home_page, portrait,
    };

    var queryCoordinate = function ( address ) {
        return new Promise( function ( resolve, reject ) {
            // DEBUG:
            //   暂时返回一个固定地址，绿地世纪城东门
            var result = [ 12119628.52, 4055386.0 ];
            resolve( result );
        } );
    };

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
        BUILDING: 3,
        HOUSE: 4,
        CHILD: 5,
    };

    var PortalType = {
        SITE: 'Site',
        CLUSTER: 'Cluster',
        ORGANIZATION: 'Organization',
        BUILDING: 'Building',
        HOUSE: 'House',
        FEATURE: 'HouseFeature',
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
    // 基本集簇样式
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

    // 相同位置不同高度的集簇样式
    function houseStyleFunction( features, resolution ) {

        var style;
        var size = feature.get( 'features' ).length;

        if ( size == 1 ) {
            var feature = features.get( 'features' )[ 0 ];
            style = new ol.style.Style( {
                geometry: feature.getGeometry(),
                fill: new ol.style.Fill( {
                    color: 'rgba(255, 255, 255, 0.3)',
                } ),
                stroke: new ol.style.Stroke( {
                    color: 'rgba(0, 0, 255, 0.3)',
                    width: 1,
                } ),
                text: new ol.style.Text( {
                    text: feature.get( 'title' ),
                    scale: 2.0,
                    padding: [ 2, 2, 2, 2 ],
                } )
            } );
        }
        else {
            var index = features.get( 'selected' );
            var feature = features.get( 'features' )[ index === undefined ? 0 : index ] ;
            style = new ol.style.Style( {
                geometry: feature.getGeometry(),
                stroke: new ol.style.Stroke( {
                    color: 'rgba(0, 0, 255, 0.3)',
                    lineDash: [ 5, 5 ],
                    width: 1,
                } ),
                image: new ol.style.RegularShape({
                    radius: 8,
                    points: Math.max( 3, size ),
                    fill: new ol.style.Fill( {
                        color: [ 0, 103, 252, 0.6 ]
                    } )
                } ),
                text: new ol.style.Text( {
                    text: size.toString(),
                    scale: 2.0,
                    padding: [ 2, 2, 2, 2 ],
                } )
            } );

        }

        return style;

    }

    // 相同位置不同年代的集簇样式

    // 标题样式
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

    function createAngleOverlay( name ) {

        var element = document.createElement( 'DIV' );
        element.innerHTML = '<input type="range" min="0" max="360" step="1" value="0">';
        element.style.width = '120px';

        return new ol.Overlay({
            id: name,
            element: element,
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
        this._app = app;

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
         * @type {HouseStack}
         */
        this.housestack = [];

        /**
         * 当前地图的房屋级别，默认是 -1，表示没有站点打开
         *
         * @public
         * @type {int}
         */
        this.houselevel = -1;


        /**
         * 数据源
         *
         * @public
         * @type {ol.source.Verctor}
         */
        this.source = new ol.source.Vector();

        /**
         * 集簇图层
         *
         * @private
         * @type {ol.layer.Verctor}
         */
        this._rootlayer = new ol.layer.Vector( {
            minResolution: CLUSTER_MIN_RESOLUTION,
            source: new ol.source.Cluster( {
                distance: CLUSTER_DEFAULT_DISTANCE,
                source: this.source,
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
        this.planegroup = new ol.layer.Group();
        this.solidgroup = new ol.layer.Group();
        this.titlegroup = new ol.layer.Group();
        this.scenegroup = new ol.layer.Group();
        this.childgroup = new ol.layer.Group();


        this._planelayer = new ol.layer.Group( {
            layers: [ this.planegroup ],
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
            interactions: ol.interaction.defaults().extend( [ ] ),
            controls: [
                new CompassControl(),
                new LocatorControl(),
            ],
            layers: [ this._basegroup, this._rootlayer, this._childlayer,
                      this._planelayer, this._solidlayer, this._titlelayer,
                      this._scenelayer,
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
        // this.map.addOverlay( createAngleOverlay( 'arrow' ) );

        this.map.on( 'singleclick', this.handleSingleClick_, this );

    };
    ifuture.inherits( Map, ifuture.Component );

    Map.prototype.hiberate = function () {
    };

    Map.prototype.revive = function () {

        var scope = this;
        var title = '远景网';

        var features = [];
        db.queryVillages().then( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmtwkt.readFeature( 'POINT ( ' + item.coordinate.split( ',' ).join( ' ' ) + ' )' );
                feature.setProperties( {
                    type: item.type,
                    title: item.title,
                    url: item.url,
                }, true );
                features.push( feature );
            } );
            scope.setRootSite( FUTURE_ROOT_SITE, features );
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
        if ( type === 'plane' ) {
            this._planelayer.setVisible( true );
            this._solidlayer.setVisible( false );
            if ( this._threeview )
                this._threeview.setVisible( false );
        }
        else if ( type === 'solid' ) {
            this._planelayer.setVisible( false );
            this._solidlayer.setVisible( true );
            if ( this._threeview )
                this._threeview.setVisible( false );
        }
        else if ( type == 'three' ) {
            this._planelayer.setVisible( true );
            this._solidlayer.setVisible( false );
            if ( this._threeview ) {
                this._threeview.setVisible( true );
            }
            else {
                requirejs( [ 'solid' ], function ( Solid ) {
                    this._threeview = new Solid( {
                        target: this.map.getTargetElement(),
                    } );
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

            var features = feature.get( 'features' );
            var size = features.length;

            if ( features[ 0 ].get( 'type' ) === PortalType.HOUSE ) {

                if ( size === 1 ) {
                    this.popHouseStack_( this.houselevel + 1 );
                    this.openHouse_( features[ 0 ].get( 'url' ) );
                }

                // 在同一个位置存在多个房屋，显示楼层选择对话框，选择一个楼层
                else {
                    var elevations = [];
                    features.forEach( function ( item ) {
                        elevations.push( {
                            title: item.get('title'),
                            floor: item.get('floor'),
                            url: item.get('url'),
                        } );
                    } );
                    this.selectElevationDialog_( elevations, function ( selected ) {
                        var level = this.houselevel + 1;
                        this.popHouseStack_( level );
                        this.housestack.push( {
                            elevations: elevations,
                        } );
                        openHouseInElevation_( level, selected );
                    }.bind( this ), -1 );
                }

            }

            else {
                this.popHouseStack_( this.houselevel + 1 );

                if ( size > 1 ) {
                    var item = this.pushClusterView_( features );
                    var site = FUTURE_ROOT_SITE;
                    item.type = PortalType.CLUSTER;
                    item.url = site.id;
                    item.title = site.title;
                    item.description = site.description;
                    item.metadata = {
                        locations: site.locations,
                    };

                    var geometry = features[ 0 ].getGeometry()
                    this.selectHouseLevel_( this.housestack.length - 1,
                                            geometry === undefined ? undefined : ol.extent.getCenter( geometry.getExtent() ) );
                    this.dispatchEvent( new ifuture.Event( 'view:opened' ) );
                }

                else {
                    this.openHouse_( features[ 0 ].get( 'url' ) );
                }
            }

        }

        else {

            var type = feature.get( 'type' );

            if ( type === PortalType.BUILDING || type === PortalType.HOUSE ) {
                this.openHouse_( feature.get( 'url' ) );
            }

            else {
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
     * 在地图上创建房子相关的图层
     *
     * @param {string} url 指向房屋的连接
     * @private
     */
    Map.prototype.openHouse_ = function ( url ) {

        for ( var i = this.housestack.length - 1; i > -1 ; i -- ) {
            if ( this.housestack[ i ].url === url ) {
                this.selectHouseLevel_( i );
                return;
            }
        }

        var level = this.houselevel;
        var xhr = new XMLHttpRequest();

        xhr.onloadend = function ( e ) {
            if ( xhr.status !== 200 ) {
                console.log( '读取房屋数据返回错误(' + xhr.status + '): ' + e );
                utils.warning( '读取房屋数据失败' );
                return;
            }
            this.openHouseItem_( url, JSON.parse( xhr.responseText ), level );
        }.bind( this );

        xhr.open( 'GET', CONFIG_FILE( url ), true );
        xhr.send();

    };

    /**
     * 在当前显示层次创建指定楼层的房子
     *
     * @param {int} level 打开的显示层次
     * @param {int} elevation 楼层索引
     * @private
     */
    Map.prototype.openHouseInElevation_ = function ( level, elevation ) {

        if ( level < 0 || level >= this.housestack.length )
            return;

        var v = this.housestack[ level ];
        if ( v.currentElevation === elevation || v.elevations == undefined )
            return;

        this.popHouseStack_( level + 1 );

        var baseurl = v.url;
        var url = CONFIG_FILE( v.url );
        var xhr = new XMLHttpRequest();
        xhr.onloadend = function() {

            if (xhr.status != 200) {
                console.log( '读取房屋 [' + url + '] 数据失败 (' + xhr.status + '): ' + e );
                utils.warning( '读取房屋数据失败' );
                return;
            }

            this.createHouseItem_( baseurl, JSON.parse( request.responseText ), level );
            v.currentElevation = elevation;

            this.selectHouseLevel_( level );
            this.dispatchEvent( new ifuture.Event( 'view:opened' ) );
            this.dispatchEvent( new ifuture.Event( 'elevation:changed', { elevation: elevation, level: level } ) );

        }.bind( this );

        xhr.open( 'GET', url, true );
        xhr.send();

    };

    /**
     * 创建一个房屋结构的结点
     *     house 是配置文件
     *     level 是显示层次
     *
     * @param {string} url 项目对应的 URL
     * @param {Object} house 项目对应的配置文件
     * @param {int} level 组织机构结点对应的图层级别
     *
     */
    Map.prototype.createHouseItem_ = function ( url, house, level ) {

        var geometry = fmtwkt.readGeometry( house.geometry );
        var extent = geometry.getExtent();
        var resolution = this.view.getResolutionForExtent( extent );

        var item = this.housestack[ level ];
        item.extent = extent;
        item.center = ol.extent.getCenter( extent );
        item.resolution = resolution * 1.1;
        item.url = url;
        item.title = house.title;

        var layers = this.createHouseLayers_( house, url );
        this.planegroup.getLayers().push( layers[ 0 ] === undefined ? emptyLayer() : layers[ 0 ] );
        this.solidgroup.getLayers().push( layers[ 1 ] === undefined ? emptyLayer() : layers[ 1 ] );
        this.titlegroup.getLayers().push( layers[ 2 ] === undefined ? emptyLayer() : layers[ 2 ] );
        this.scenegroup.getLayers().push( layers[ 3 ] === undefined ? emptyLayer() : layers[ 3 ] );
        this.childgroup.getLayers().push( layers[ 4 ] === undefined ? emptyLayer() : layers[ 4 ] );

    };

    /**
     * 打开一个房屋结构的结点
     *     item 是配置文件
     *     level 是显示层次
     *
     * @param {string} url 项目对应的 URL
     * @param {Object} house 项目对应的配置文件
     * @param {int} level 组织机构结点对应的图层级别
     *
     */
    Map.prototype.openHouseItem_ = function ( url, house, level ) {

        level = level === undefined ? 0 : level + 1;
        console.assert( level < this.housestack.length + 1 );

        this.popHouseStack_( level );

        var geometry = fmtwkt.readGeometry( house.geometry );
        var extent = geometry.getExtent();

        var item = this.pushExtentView_( extent );
        item.type = PortalType.HOUSE;
        item.url = url;
        item.title = house.title;
        item.description = '';
        item.creator = house.creator;

        var layers = this.createHouseLayers_( house, url );
        this.planegroup.getLayers().push( layers[ 0 ] === undefined ? emptyLayer() : layers[ 0 ] );
        this.solidgroup.getLayers().push( layers[ 1 ] === undefined ? emptyLayer() : layers[ 1 ] );
        this.titlegroup.getLayers().push( layers[ 2 ] === undefined ? emptyLayer() : layers[ 2 ] );
        this.scenegroup.getLayers().push( layers[ 3 ] === undefined ? emptyLayer() : layers[ 3 ] );
        this.childgroup.getLayers().push( layers[ 4 ] === undefined ? emptyLayer() : layers[ 4 ] );

        this.selectHouseLevel_( level );
        this.dispatchEvent( new ifuture.Event( 'view:opened' ) );

    };

    // 返回五个 layer, 如果没有对应的图层数据，也返回一个空的 layer
    //     plan, stereo, label, feature, child
    Map.prototype.createHouseLayers_ = function ( house, baseurl ) {

        var planelayer, stereolayer, labellayer, featurelayer, childlayer;
        var housetype = house.type;

        house.views.forEach( function ( view ) {

            var geometry = fmtwkt.readGeometry( view.geometry );
            var imageExtent = geometry.getExtent();

            if ( [ 'plane', 'solid' ].indexOf( view.type ) > -1 ) {
                var layer = new ol.layer.Image( {
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    extent: imageExtent,
                    source: new ol.source.ImageStatic( {
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent,
                        url: view.url,
                    } )
                } );
                if ( view.type === 'plane' )
                    planelayer = layer;
                else ( view.type === 'solid' )
                    stereolayer = layer;
            }
            else if ( view.type === 'label' ) {
                var source = new ol.source.Vector( {
                    features: wktfmt.readFeatures( view.features ),
                } );

                labellayer = new ol.layer.Vector( {
                    extent: extent,
                    source: source,
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    style: labelStyleFunction,
                } );
            }

        } );


        if ( house.children ) {

            var features = [];
            house.children.forEach( function ( child ) {
                var feature = fmtwkt.readFeature( child.geometry );
                feature.setProperties( {
                    type: child.type,
                    title: child.title,
                    url: formatUrl( child.name, baseurl ),
                }, true );
                if ( child.floor !== undefined )
                    feature.set( 'floor', child.floor, true );
                features.push( feature );
            } );
            var source = new ol.source.Vector( { features: features } );

            if ( 0 && housetype === PortalType.BUILDING ) {
                childlayer = new ol.layer.Vector( {
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    source: new ol.source.Cluster( {
                        distance: CLUSTER_DEFAULT_DISTANCE,
                        source: source,
                    } ),
                    style: houseStyleFunction,
                } );
            }
            else
                childlayer = new ol.layer.Vector( {
                    source: source,
                    minResolution: SITE_MIN_RESOLUTION,
                    maxResolution: SITE_MAX_RESOLUTION,
                    style: childstyle,
                } );

        }

        if ( house.features ) {
            var features = [];
            house.features.forEach( function ( item ) {
                var feature = fmtwkt.readFeature( 'POINT (' + item.coordinate.split( ',' ).join( ' ' ) + ' )' );
                feature.setProperties( {
                    type: item.phase_type,
                    title: item.title,
                    angle: item.angle,
                    url: item.url,
                }, true );
                features.push( feature );
            } );
            var source = new ol.source.Vector( { features: features } );

            featurelayer = new ol.layer.Vector( {
                source: source,
                minResolution: SITE_MIN_RESOLUTION,
                maxResolution: SITE_MAX_RESOLUTION,
                style: featurestyle,
            } );
        }

        return [ planelayer, stereolayer, labellayer, featurelayer, childlayer ];

    };

    Map.prototype.pushClusterView_ = function ( features, extent ) {

        if ( extent === undefined ) {
            extent = ol.extent.createEmpty();
            var j, jj;
            for ( j = 0, jj = features.length; j < jj; ++j ) {
                ol.extent.extend( extent, features[ j ].getGeometry().getExtent() );
            }
        }

        jj = this.housestack.length;
        for ( j = 0; j < jj; j ++ ) {
            if ( ! ol.extent.containsExtent( this.housestack[ j ].extent, extent ) )
                break;
        }
        this.popHouseStack_( j );

        this.planegroup.getLayers().push( emptyLayer() );
        this.solidgroup.getLayers().push( emptyLayer() );
        this.titlegroup.getLayers().push( emptyLayer() );
        this.scenegroup.getLayers().push( emptyLayer() );
        this.childgroup.getLayers().push( emptyLayer() );

        return this.pushExtentView_( extent );

    };

    Map.prototype.pushExtentView_ = function ( extent ) {

        var resolution = this.view.getResolutionForExtent( extent );
        var item = {
            extent: extent,
            center: ol.extent.getCenter( extent ),
            resolution: resolution * 1.1,
        };
        this.housestack.push( item );
        return item;

    };

    Map.prototype.createHouseCarousel_ = function ( level ) {

        level = level === undefined ? this.houselevel : level;

        var items = [];

        if ( level < 0 || level > this.housestack.length - 1 ) {

            items.push( {
                type: 'cover',
                title: FUTURE_ROOT_SITE.title,
                description: FUTURE_ROOT_SITE.description,
            } );

        }

        else {

            var layer = this.scenegroup.getLayers().item( level );
            var vitem = this.housestack[ level ];
            var title = vitem.title;
            var description = vitem.description;

            items.push( {
                type: 'cover',
                title: title,
                description: description,
            } );

            if ( layer instanceof ol.layer.Vector ) {
                layer.getSource().forEachFeature( function ( feature ) {
                    var url = feature.get( 'url' );
                    items.push( {
                        type: feature.get( 'type' ),
                        title: feature.get( 'title' ),
                        url: url,
                        coordinate: feature.getGeometry().getFirstCoordinate(),
                        angle: feature.get( 'angle' ),
                    } );
                } );
            }
        }

        this._app.request( 'explorer', 'setItems', [ items ] );
        this.toggleVisible( 'visitor', false );

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
     * @param {Array.<number>} extent 视图的区域
     * @param {Array.<number>|undefined} center 中心坐标，如果没有指定，那么切换到区域中心
     * @observable
     * @api
     */
    Map.prototype.fitView = function ( extent, center ) {

        if ( ol.extent.isEmpty( extent ) )
            return;

        center = center === undefined ? ol.extent.getCenter( extent ) : center;
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

        this._app.request( 'communicator', 'startBroadcast', roomName );
        this._app.request( 'modebar', 'add', [ 'living', {
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
        this._app.request( 'communicator', 'stopBroadcast' );
        this._app.request( 'modebar', 'remove', 'living' );
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

        this._app.request( 'communicator', 'openLiving', roomName );

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
        this._app.request( 'communicator', 'closeLiving' );

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
     * 弹出站点堆栈。
     *
     * 如果 level 是 undefined, 弹出最后一个, 否则弹出 level 指定的层。
     *
     * level = 0 会清空整个站点堆栈
     *
     * @param {int|undefined} level
     * @private
     */
    Map.prototype.popHouseStack_ = function ( level ) {

        var n = this.housestack.length;
        var jj = Math.min( n, level === undefined ? 1 : n - level );

        for ( var i = 0; i < jj; i ++ ) {
            this.planegroup.getLayers().pop();
            this.solidgroup.getLayers().pop();
            this.titlegroup.getLayers().pop();
            this.scenegroup.getLayers().pop();
            this.childgroup.getLayers().pop();
            this.housestack.pop();
        }

    };


    /**
     *
     * 设置当前级别站点的楼层数据。
     *
     * @param {int} level
     * @private
     */
    Map.prototype.setHouseElevations_ = function ( level ) {

        var scope = this;

        while ( level > -1 ) {

            var v = this.housestack[ level ];

            if ( v.elevations !== undefined ) {
                var index = v.currentElevation;
                var elevations = v.elevations;
                this._app.request( 'modebar', 'setElevations', {
                    title: index === undefined ? '' : elevations[ index ].title,
                    callback: function ( e ) {
                        // 显示楼层选择对话框
                        scope.selectElevationDialog_( elevations, function ( selected ) {
                            scope.openHouseInElevation_( level, selected );
                        }, index );
                    },
                } );

                break;

            }

            level --;

        }

        if ( level < 0 )
            this._app.request( 'modebar', 'setElevations' );

    };

    /**
     *
     * 切换站点到堆栈的某一个层，-1 表示倒数第一个。
     *
     * @param {int} level
     * @private
     */
    Map.prototype.selectHouseLevel_ = function ( level, center ) {

        if ( this.houselevel === level )
            return;

        var n = this.housestack.length;
        if ( n == 0 ) {
            this.houselevel = -1;
            return;
        }

        var index = Math.max( 0, level < 0 ? n + level : level );
        var v = this.housestack[ index ];

        this.houselevel = index;

        this.setHouseElevations_( index );

        this.createHouseCarousel_( index );

        this.fitView( v.extent, center );

        // 如果是三维模式，那么需要装载三维对象
        if ( this._threeview && this._threeview.isVisible() ) {

        }

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

    Map.prototype.setRootSite = function ( site, features ) {

        this.popHouseStack_( 0 );

        this.source = new ol.source.Vector( { features: features } );
        var distance = CLUSTER_DEFAULT_DISTANCE;
        this._rootlayer.setSource(
            new ol.source.Cluster( {
                distance: distance,
                source: this.source,
            } )
        );

        // DEBUG:
        //   extent [ 8313981.75, 2137428.08, 15554097.07, 7244644.56 ],
        var scope = this;

        queryCoordinate( site.location ).then( function ( coordinate ) {
            scope.view.setCenter( coordinate );
            scope.view.setResolution( ROOT_SITE_RESOLUTION );
            scope.pushClusterView_( features, scope.view.calculateExtent() );

            scope.housestack[ 0 ].type = PortalType.SITE;
            scope.housestack[ 0 ].url = site.id;
            scope.housestack[ 0 ].title = site.title;
            scope.housestack[ 0 ].description = site.description;
            scope.housestack[ 0 ].metadata = {
                locations: site.locations,
            };
            scope.selectHouseLevel_( 0 );
            scope.dispatchEvent( new ifuture.Event( 'site:changed' ) );
        } );

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

        else if ( event.type === 'view:remove' ) {
            var level = event.argument;
            this.popHouseStack_( level + 1 );
            this.selectHouseLevel_( level );
        }

    };

    /**
     *
     * 打开楼层选择对话框，选择一个楼层
     *
     * @private
     */
    Map.prototype.selectElevationDialog_ = function ( elevations, callback, index ) {

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        var html = [
            '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-centered dx-modal-elevation" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h5 class="modal-title">选择楼层</h5>' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <ul class="list-group list-group-flush text-center">'
        ];

        for( var i = 0; i < elevations.length; i ++ ) {
            if ( i === index )
                html.push( '<li class="list-group-item bg-info" data-elevation="' + i + '">' + elevations[ i ].title + '</li>' );
            else
                html.push( '<li class="list-group-item" data-elevation="' + i + '">' + elevations[ i ].title + '</li>' );
        }

        html.push(
            '        </ul>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );

        var dialog = document.createElement( 'DIV' );
        dialog.innerHTML = html.join( '' );
        document.body.appendChild( dialog.firstElementChild );

        document.querySelector( '.dx-modal-elevation .modal-body > ul' ).addEventListener( 'click', function ( e ) {
            var ul = e.currentTarget;
            for (var i = 0; i < ul.children.length; i++) {
                ul.children[i].className = 'list-group-item';
            }
            e.target.className = 'list-group-item bg-info';

            if ( typeof callback === 'function' )
                callback( parseInt( e.target.getAttribute( 'data-elevation' ) ) );

            $( '.dx-modal-container' ).modal( 'hide' );
            return true;
        }, false );

        $( dialog.firstElementChild ).modal( 'show' );

    };

    return Map;

} );
