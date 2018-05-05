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
 *     _solidview
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
 *     url
 *
 * }
 *
 * SiteStack {
 *
 *     site {
 *
 *         id
 *         title
 *         url
 *
 *     }
 *
 *     center
 *     resolution
 *     maxzoom
 *     minzoom
 *
 *     overview {
 *
 *         center
 *         resolution
 *
 *     }
 *
 * }
 *
 * 底图
 *      watercolor: stamen.watercolor + stamen.toner-labels
 *      aerial: bings.aerial + stamen.terrain-labels
 *      road: gaode
 *
 * 组织机构图层
 *
 *     views: plan, stereo, solid
 *            title layer
 *            feature layer
 *            children layer
 *
 *     explorer: 第一张是当前图层的标题，例如 远景网，华清御汤，二号院，二楼，201
 *
 *     minimap:
 *
 *       底图分为集簇和区域两级
 *       下面分别是 组织机构、建筑物或者楼层、房间三级
 *
 * 大地图浏览模式（browser)
 *
 *     放大缩小, 拖曳移动地图中心
 *     点击移动 visitor
 *     点击特征图标，explorer 切换到对应的条目
 *     点击子图层，进入到对应的图层
 *
 * 大地图导播模型（anchor）
 *
 *     点击移动 camera
 *
 * 大地图观看模式（viewer）
 *
 *    点击移动 visitor
 *
 * 大地图楼层模式（elevation），小模式
 *
 *    旋转拖曳切换楼层
 *
 *
 * 默认视图
 *
 *     center
 *     resolution
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
 * 地图显示级别
 *
 *     集簇级，大范围，国家和省份，集簇方式显示组织机构
 *     区域级，小范围，城市，显示每一个组织机构
 *     组织级，显示一个组织机构或者景区
 *     楼房级，显示一个楼房或者楼层
 *     房间级，显示一个具体的房间
 *
 * 定位按钮
 *
 *     当前地图显示级别为集簇或者区域级，定位到地图的某一个位置
 *
 *     显示级别为组织级的时候，如果在组织机构内，那么定位到地图位置；
 *     如果不在组织机构内，地球切换到区域级进行显示
 *
 *     显示级别为楼房或者房间级，如果在当前建筑物内部，那么切换到对应
 *     的楼房或者房间；如果在组织机构内部，那么切换到组织机构级别；其
 *     他情况则切换到区域级别显示
 *
 * 方向指针
 *
 *     在不支持陀螺仪或者指北针的设备上，当地图旋转之后出现，点击设置
 *     地图指向正北方向
 *
 *     在支持陀螺仪或者指北针的设备上，在定位模式下，地图自动旋转，始
 *     终指向正北方向，点击可以固定地图方向，再次点击则
 *
 *     非定位模式则仅当地图旋转之后出现，点击设置地图指向正北方向
 *
 * 游客视野
 *
 *     显示当前视野和位置，一般和旋转木马配合使用，显示对应照片的位置
 *     和拍摄角度
 *
 * 直播视野
 *
 *     显示直播摄像头的位置和视野
 */

define( [ 'ifuture', 'ol', 'db', 'utils', 'config',
          'plugins/interaction/feature',
          'plugins/interaction/dimension' ],

function( ifuture, ol, db, utils, config, FeatureInteraction, DimensionInteraction ) {

    var formatUrl = utils.formatUrl;
    var fmtwkt = new ol.format.WKT();

    var CLUSTER_MIN_RESOLUTION = 10;
    var CLUSTER_DEFAULT_DISTANCE = 20;

    var BASEMAP_MIN_RESOLUTION = 0.1;
    var BASEMAP_LABEL_MIN_RESOLUTION = 800;

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

    // 集簇样式
    function culsterStyleFunction( feature, resolution ) {

        var style;
        var size = feature.get( 'features' ).length;
        var radius = size < 10 ? 16 : size < 100 ? 24 : 32;
        var opacity = Math.min( 0.8, 0.4 + ( size / radius );

        if ( size > 1 ) {
            style = new ol.style.Style( {
                image: new ol.style.Circle({
                    radius: radius,
                    fill: new ol.style.Fill( {
                        color: [ 255, 153, 0, opacity ) ]
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

    var labelstyle = new ol.style.Style( {
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

    // 默认坐标系 EPSG:3857

    // 绿地世纪城东门位置
    var defaultlocation = [ 12119628.52, 4055386.0 ];
    var defaultresolution = 20;

    // 底图分辨率
    var maxresolution = 100;
    var minresolution = 0.01;

    // 建筑物内部最大分辨率
    var MAX_RESOLUTION = 6.18;
    var MIN_RESOLUTION = 0.001;

    var ViewLevel = {
        CLUSTER: 0,
        REGION: 1,
        SITE: 2,
        BUILDING: 3,
        ROOM: 4,
    };

    var featureLoader = function ( extent, resolution, projection ) {

        var features = [];

        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmtwkt.readFeature( item.geometry );
                if ( feature ) {
                    feature.setId( item.id );
                    feature.setProperties( {
                        type: FeatureType.SITE,
                        title: item.title,
                        url: formatUrl( item.url ),
                    }, true );
                    features.push( feature );
                }
            } );
        } );

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

    Map = function ( app, opt_options ) {

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
            maxResolution: CLUSTER_MIN_RESOLUTION,
            visible: true,
        } );

        this._solidlayer = new ol.layer.Group( {
            layers: [ this.solidgroup ],
            maxResolution: CLUSTER_MIN_RESOLUTION,
            visible: false,
        } );

        this._titlelayer = new ol.layer.Group( {
            layers: [ this.titlegroup ],
            maxResolution: CLUSTER_MIN_RESOLUTION,
            visible: true,
        } );

        this._scenelayer = new ol.layer.Group( {
            layers: [ this.scenegroup ],
            maxResolution: CLUSTER_MIN_RESOLUTION,
            visible: false,
        } );

        this._childlayer = new ol.layer.Group( {
            layers: [ this.childgroup ],
            maxResolution: CLUSTER_MIN_RESOLUTION,
            visible: true,
        } );

        /**
         * 三维图，显示当前组织机构内部对象的三维模型
         *
         * @public
         * @type {Solid}
         */
        this._solidview = null;

        /**
         * 所有使用到的底图图层的定义，这些都是公共地图
         * @private
         * @type {Object}
         */
        this._baselayers = {
            light: new ol.layer.Tile( {
                visible: true,
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
                minResolution: BASEMAP_LABEL_MIN_RESOLUTION,
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
            center: location,
            minResolution: v.minResolution,
            maxResolution: v.maxResolution,
            resolution: v.resolution,
        } );

        var span = document.createElement( 'SPAN' );
        span.innerHTML = '<i class="fas fa-long-arrow-alt-up"></i>';

        this.map = new ol.Map( {
            target: options.target ? options.target : 'map',
            interactions: ol.interaction.defaults().extend( [
                // new FeatureInteraction( this ),
                new DimensionInteraction( this ),
            ] ),
            controls: [
                new ol.control.Rotate( {
                    className: 'rounded-circle ol-rotate',
                    label: span,
                } ),
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

        this.map.on( 'singleclick', function( evt ) {
            var map = evt.map;
            var selected = map.forEachFeatureAtPixel( evt.pixel, function ( feature, layer ) {
                return [ feature, layer ];
            } );

            var feature, layer;
            if ( selected !== undefined ) {
                feature = selected[ 0 ];
                layer = selected[ 1 ];
            }

            this.handleClickEvent( evt, feature, layer );

            return true;

        }.bind( this ) );

    };
    ifuture.inherits( Map, ifuture.Component );

    Map.prototype.hiberate = function () {
    };

    Map.prototype.revive = function () {
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
            if ( this._solidview )
                this._solidview.setVisible( false );
        }
        else if ( type === 'stereo' ) {
            this._planlayer.setVisible( false );
            this._solidlayer.setVisible( true );
            if ( this._solidview )
                this._solidview.setVisible( false );
        }
        else if ( type == 'solid' ) {
            this._planlayer.setVisible( true );
            this._solidlayer.setVisible( false );
            if ( this._solidview ) {
                this._solidview.setVisible( true );
            }
            else {
                requirejs( [ 'solid' ], function ( Solid ) {
                    this._solidview = new Solid();
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
            this.labelGroup.setVisible( visible === undefined ? ! this.labelGroup.getVisible() : visible );
        }
        else if ( name === 'feature' ) {
            this.featureGroup.setVisible( visible === undefined ? ! this.featureGroup.getVisible() : visible );
        }
        else if ( name === 'visitor' || name === 'camera' ) {
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
     * 删除视图级别之下的所有图层
     *
     * @param {int} level
     * @public
     */
    Map.prototype.removeViewLevel = function ( level ) {
        if ( level === undefined || level < ViewLevel.ORGANIZATION )
            return;
        level -= ViewLevel.ORGANIZATION;
        level --;
        while ( this.layerLevel > level ) {
            this.planGroup.getLayers().pop();
            this.stereoGroup.getLayers().pop();
            this.labelGroup.getLayers().pop();
            this.featureGroup.getLayers().pop();
            this.childrenGroup.getLayers().pop();
            this.layerStack.pop();
            this.layerLevel --;
        }
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

            if ( this.viewLevel > ViewLevel.ORGANIZATION )
                this.removeViewLevel( ViewLevel.ORGANIZATION );

            var features = feature.get( 'features' );
            var size = features.length;

            if ( this.viewLevel === ViewLevel.CLUSTER ) {
                this.setViewLevel( ViewLevel.REGION );
                // var extent = ol.extent.createEmpty();
                // var j, jj;
                // for ( j = 0, jj = features.length; j < jj; ++j ) {
                //     ol.extent.extend( extent, features[ j ].getGeometry().getExtent());
                // }
                // this.view.setCenter( ol.extent.getCenter( extent ) );
                var orgfeature = features[ 0 ];
                var center = ol.extent.getCenter( orgfeature.getGeometry().getExtent() );
                this.views_.forEach( function ( v ) {
                    v.setCenter( center );
                } );

                // 发出新的视图层次创建消息
                this.dispatchEvent( new ifuture.Event( 'cluster:open', features ) );
            }

            else if ( this.viewLevel === ViewLevel.REGION ) {
                var orgfeature = features[ 0 ];
                if ( size > 1 ) {
                    this.view.setCenter( ol.extent.getCenter( orgfeature.getGeometry().getExtent() ) );
                    this.view.setZoom( this.view.getZoom() + 1 );
                }

                else {
                    this.openOrganization_( orgfeature.get( 'url' ), orgfeature.get( 'origin' ) );
                }
            }

        }

        else {

            var type = feature.get( 'type' );

            if ( type === FeatureType.SITE || type === FeatureType.CHILD ) {
                this.openOrganization_( feature.get( 'url' ), feature.get( 'origin' ) );
            }

            else if ( type === FeatureType.FEATURE ) {
                this.dispatchEvent( new ifuture.Event( 'feature:click', feature ) );
            }

        }
    };

    /**
     * 地图点击事件的处理，根据模式不同进行相应的操作
     *
     *     browser: 什么也不做
     *     viewer: 切换 visitor 的位置
     *     anchor: 切换 camera 的位置
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     *
     * @private
     */
    Map.prototype.handleClickMapEvent_ = function ( evt ) {

        var mode = this.majorMode_;

        if ( mode === 'anchor' ) {
            this.setVisionHelper( 'camera', evt.coordinate );
        }

        else if ( mode === 'viewer' ) {
            this.setVisionHelper( 'visitor', evt.coordinate );
        }

        else
            console.assert ( mode === 'browser' );

    };

    /**
     * 打开组织机构或者子结点
     *
     * @param {string} url 指向组织机构的链接
     * @param {Array.<number>|undefined} origin 组织机构对应的原点
     * @private
     */
    Map.prototype.openOrganization_ = function ( url, origin ) {

        var level = this.layerLevel;

        for ( var i = 0; i < this.layerStack.length; i ++ ) {
            if ( this.layerStack[ i ].url === url ) {
                this.selectLayerLevel_( i );
                return;
            }
        }

        var request = new XMLHttpRequest();
        // request.onerror = function ( event ) {
        //     utils.warning( '读取特征数据 ' + url + '时出现了错误!' );
        // };
        request.onloadend = function() {
            if (request.status != 200) {
                utils.warning( '读取数据 ' + url + '失败，服务器返回代码：' + request.status );
                return;
            }
            var item = JSON.parse( request.responseText );
            this.openItem_( url, item, level, origin );
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

        // 对应条目已经打开
        if ( this.layerStack.length > level && this.layerStack[ level ].url === url ) {
            this.selectLayerLevel_( level );
            return;
        }

        console.assert( level < this.layerStack.length + 1 );
        if ( level < this.layerStack.length ) {
            this.removeViewLevel( level + ViewLevel.ORGANIZATION );
        }

        if ( ! origin ) {
            origin = ! item.origin ? [ 0., 0. ] : item.origin;
        }

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
        this.layerStack.push( {
            name: item.name,
            title: item.title,
            url: url,
            extent: extent,
            origin: origin,
            elevations: item.elevations,
        } );

        // 创建图层
        var layers = this.createItemLayers_( item, url, extent, origin );
        this.planGroup.getLayers().push( layers[ 0 ] );
        this.stereoGroup.getLayers().push( layers[ 1 ] );
        this.labelGroup.getLayers().push( layers[ 2 ] );
        this.featureGroup.getLayers().push( layers[ 3 ] );
        this.childrenGroup.getLayers().push( layers[ 4 ] );

        // 设置当前 level
        this.selectLayerLevel_( level );

        // 发出新的视图层次创建消息
        this.dispatchEvent( new ifuture.Event( 'node:open', this.viewLevel ) );

    };

    // 返回五个 layer, 如果没有对应的图层数据，也返回一个空的 layer
    //     plan, stereo, label, feature, child
    Map.prototype.createItemLayers_ = function ( item, baseurl, extent, origin ) {

        function createEmptyLayer() {
            return new ol.layer.Group( { visible: false } );
        };

        // 对于多层，在 selectLayerLevel 的时候生成对应的图层
        if ( item.elevations !== undefined ) {
            return [ createEmptyLayer(), createEmptyLayer(),
                     createEmptyLayer(), createEmptyLayer(), createEmptyLayer() ];
        }

        var features, source;
        var planlayer, stereolayer, labellayer, featurelayer, childlayer;
        var fmt = new ol.format.WKT();

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
                    minResolution: MIN_RESOLUTION,
                    maxResolution: MAX_RESOLUTION,
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
                stereolayer = createEmptyLayer();
            }
            else {
                var imageExtent = stereo.extent;
                this.translateExtent( imageExtent, origin );
                ol.extent.extend( extent, imageExtent );
                stereolayer = new ol.layer.Image( {
                    opacity: 0.8,
                    minResolution: MIN_RESOLUTION,
                    maxResolution: MAX_RESOLUTION,
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
                labellayer = createEmptyLayer();
            }
            else {
                features = [];
                for ( var i = 0; i < label.length; i ++ ) {
                    var node = label[ i ];
                    var feature = fmt.readFeature( node.geometry );
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
                    minResolution: MIN_RESOLUTION,
                    maxResolution: MAX_RESOLUTION,
                    style: labelstyle,
                } );
            }
        }

        features = [];
        if ( item.children ) {
            for ( var i = 0; i < item.children.length; i ++ ) {
                var node = item.children[ i ];
                var feature = fmt.readFeature( node.geometry );
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
            minResolution: MIN_RESOLUTION,
            maxResolution: MAX_RESOLUTION,
            style: childstyle,
        } );

        features = [];
        if ( item.features ) {
            for ( var i = 0; i < item.features.length; i ++ ) {
                var node = item.features[ i ];
                var feature = fmt.readFeature( node.geometry );
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
            minResolution: MIN_RESOLUTION,
            maxResolution: MAX_RESOLUTION,
            style: featurestyle,
        } );

        return [ planlayer, stereolayer, labellayer, featurelayer, childlayer ];
    };

    Map.prototype.selectLayerLevel_ = function ( level ) {

        var item = this.layerStack[ level ];
        this.layerLevel = level;

        // 当前和上级是否是多层
        var i = level;
        while ( i >= 0 ) {

            // 显示设置楼层按钮
            if ( this.layerStack[ i ].elevations !== undefined ) {

                this.app_.request( 'modebar', 'setElevations', {
                    data: this.layerStack[ i ].elevations,
                    level: i,
                    callback: function ( level, elevation ) {
                        this.selectElevation_( level, elevation );
                        this.fitView( this.layerStack[ level ].extent );
                    }.bind( this ),
                } );

                this.dispatchEvent( new ifuture.Event( 'elevation:changed', {
                    elevation:
                    this.layerStack[ i ].currentElevation,
                    level: i
                } ) );

                break;

            }

            i --;

        }

        // 隐藏楼层按钮
        if ( i < 0 )
            this.app_.request( 'modebar', 'setElevations', {} );

        // 装载最顶层的图层
        if ( item.elevations !== undefined && item.currentElevation === undefined ) {
            this.selectElevation_( level, item.elevations.length - 1 );
        }

        this.setViewLevel( level + ViewLevel.ORGANIZATION );

        // 显示选中的图层
        this.fitView( item.extent );

    };

    Map.prototype.createViewCarousel_ = function ( level ) {

        level = level === undefined ? this.viewLevel : level;

        var items = [];

        if ( level < ViewLevel.ORGANIZATION ) {

            items.push( {
                minetype: 'cover',
                title: '远景网',
            } );

        }

        else {

            level -= ViewLevel.ORGANIZATION;

            var layer = this.featureGroup.getLayers().item( level );
            var title = this.layerStack[ level ].title;

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

        var item = this.layerStack[ level ];
        if ( item.currentElevation === elevation )
            return;

        // 选择不同的楼层，需要确保下级图层都被清除
        // TODO: 需要通知 minimap 也删除下面的级别和层次
        //       或者把 minimap 的信息也合并到 this.layerStack 中来
        this.removeViewLevel( level + ViewLevel.ORGANIZATION + 1 );

        var baseurl = item.url + '/floor' + elevation;
        var request = new XMLHttpRequest();

        request.onloadend = function() {

            if (request.status != 200) {
                utils.warning( '读取楼层数据 ' + baseurl + '失败，服务器返回代码：' + request.status );
                return;
            }

            this.openElevation_( JSON.parse( request.responseText ), baseurl, item.extent );
            item.currentElevation = elevation;
            var vlevel = level + ViewLevel.ORGANIZATION;
            if ( this.viewLevel === vlevel )
                this.createViewCarousel_( vlevel );
            else
                this.setViewLevel( vlevel );
            this.dispatchEvent( new ifuture.Event( 'elevation:changed', { elevation: elevation, level: level } ) );

        }.bind( this );

        request.open( 'GET', baseurl + '/config.json' );
        request.send();

    };

    Map.prototype.openElevation_ = function ( data, baseurl, extent ) {

        var origin = ! data.origin ? [ 0, 0 ] : data.origin;
        var layers = this.createItemLayers_( data, baseurl, extent, origin );

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

    /**
     *
     * 设置地图的显示级别
     *
     * @param {int} level 级别
     * @observable
     * @api
     */
    Map.prototype.setViewLevel = function ( level ) {

        if ( this.viewLevel !== level ) {
            var view = this.views_[ level ];
            this.map.setView( view );
            this.map.render();

            this.view = view;
            this.viewLevel = level;
            this.layerLevel = Math.max( -1, level - ViewLevel.ORGANIZATION );

            this.createViewCarousel_( level );
        }

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

        // 所有其他视图也要统一修改中心
        this.views_.forEach( function ( v ) {
            if ( this.view !== v )
                v.setCenter( center );
        }.bind( this ) );

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

        this.setVisionHelper( 'camera', null, heading );

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
        this.isLiving_ = false;

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
        if ( this._solidview && this._solidview.isVisible() )
            this._solidview.render();
    };

    return Map;

    /**
     *
     * 添加站点到堆栈。
     *
     * @param {Object<name, title, url>} site
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
    };

    /**
     *
     * 切换站点到堆栈的某一个层。
     *
     * @param {int} level
     * @private
     */
    Map.prototype.selectSiteLevel_ = function ( level ) {
    };

    /**
     *
     * 设置地图的根站点
     *
     * @param {Object<name, title, url>} site
     * @param {Array<ol.Feature>} features
     * @param {Object<extent, resolution, distance>} options
     * @observable
     * @api
     */

    Map.prototype.setRootSite = function ( site, features, options ) {

        this.popSiteStack_( 0 );

        this._clusterlayer.getSource().clear( { fast: true } );
        this._clusterlayer.getSource().addFeatures( features );

        this.pushSiteStack_( site );
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

        //
        //
        //
        if ( event.type === 'helper:changed' ) {
            var arg = event.argument;
            this.setVisionHelper( arg.name, arg.position, arg.yaw );
        }

        else if ( event.type === 'living:opened' ) {
            this.setMajorMode( 'viewer' );
        }

    };


} );
