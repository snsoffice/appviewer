define( [ 'ifuture', 'config', 'logger', 'ol', 'app/dialog' ], function ( ifuture, config, logger, ol, dialog ) {

    var _SELECTOR = '.dx-screen';
    var _CLOSE_BUTTON_SELECTOR = '.dx-toolbar button:nth-of-type(1)';
    var _HANGUP_BUTTON_SELECTOR = '.dx-toolbar button:nth-of-type(2)';

    var _VIDEO_TEMPLATE = '                                            \
        <div class="dx-video w-100 h-100 bg-dark">                     \
          <video autoplay="autoplay"></video>                          \
        </div>';

    var _TEMPLATE = '                                                                      \
        <div class="dx-toolbar">                                                           \
          <button type="button" class="btn btn-outline-secondary border-0 mx-3 my-2">      \
            <i class="fas fa-times fa-2x"></i>                                             \
          </button>                                                                        \
          <button type="button" class="btn btn-outline-secondary border-0 mx-3 my-2 fa-2x" \
                  style="display: none; opacity: 0.8;">                                    \
            <span class="fa-layers fa-fw text-danger">                                     \
              <i class="fas fa-phone"></i>                                                 \
              <i class="fas fa-times" data-fa-transform="shrink-8 up-4 left-4"></i>        \
            </span>                                                                        \
          </button>                                                                        \
        </div>                                                                             \
        <div class="dx-view-tool mx-3 mb-2">                                               \
          <button class="btn btn-outline-secondary border-0 mr-2" type="button"            \
                  data-toggle="modal" data-target="#screen-frame-dialog">                  \
            <i class="fas fa-th fa-lg"></i>                                                \
          </button>                                                                        \
        </div>';

    var _FRAME_DIALOG_TEMPLATE = '                                                            \
        <div class="modal fade" id="screen-frame-dialog"                                      \
             tabindex="-1" role="dialog" aria-hidden="true">                                  \
          <div class="modal-dialog modal-dialog-centered" role="document">                    \
            <div class="modal-content" style="background: transparent;">                      \
              <div class="d-flex flex-column justify-content-center align-items-center">      \
                <div class="p-0">                                                             \
                  <button class="btn btn-sm btn-outline-secondary m-2" data-dismiss="dialog"  \
                          type="button" view-type="plane" view-index="0">房屋平面图</button>  \
                  <button class="btn btn-sm btn-outline-secondary m-2"                        \
                          type="button" view-type="solid" view-index="0">房屋立体图</button>  \
                  <button class="btn btn-sm btn-outline-secondary m-2"                        \
                          type="button" view-type="plane" view-index="2">楼层平面图</button>  \
                  <button class="btn btn-sm btn-outline-secondary m-2"                        \
                          type="button" view-type="solid" view-index="2">楼层立体图</button>  \
                  <button class="btn btn-sm btn-outline-secondary m-2"                        \
                          type="button" view-type="plane" view-index="1">小区平面图</button>  \
                  <button class="btn btn-sm btn-outline-secondary m-2"                        \
                          type="button" view-type="solid" view-index="1">小区立体图</button>  \
                </div>                                                                        \
              </div>                                                                          \
           </div>                                                                             \
          </div>                                                                              \
        </div>';

    var _FRAME_BUTTONS_SELECTOR = 'div.modal button';

    var _LOCATION_MARKER_URL = 'images/location_marker.png';
    var _LOCATION_MARKER_HEADING_URL = 'images/location_marker_heading.png';

    var _MARKER_ID = 'marker';

    // .dx-mini
    var _DEFAULT_MAP_SIZE = [ 200, 150 ];

    Screen = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._element = null;

        /**
         * 当前直播房子的数据
         * @private
         * @type {Object} 属性包括 url, views, locations, callee
         */
        this._house = null;

        /**
         * 视频对象
         * @private
         * @type {HTMLVideoElement}
         */
        this._video = null;

        /**
         * 房屋结构图
         * @private
         * @type {ol.Map}
         */
        this._map = null;

        /**
         * 指南针角度，
         *
         *     undefined  不确定，需要进行判断
         *     null       不支持
         *     数值       支持，当前指南针的方向，弧度值
         *
         * @private
         * @type {number|undefined}
         */
        this._direction = undefined;

        /**
         * 当前位置和相机角度传感器
         * @private
         * @type {ol.Map}
         */
        this._sensor = new ol.Geolocation();

    }
    ifuture.inherits( Screen, ifuture.Component );

    /**
     *
     * 事件绑定程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @observable
     * @api
     */
    Screen.prototype.bindFutureEvent = function () {

        this.app.on( 'open:screen', function ( e ) {
            this.openScreen_( e.argument );
        }, this );

        this.app.on( 'close:screen', function ( e ) {
            this.closeScreen_();
        }, this );

        this.app.on( 'screen:opened', this.onScreenOpened_, this );

        this.app.on( 'screen:closed', function ( e ) {
            this._element.style.display = 'none';
        }, this );

        this.app.on( 'change:anchor', function ( e ) {
            var arg = e.argument;
            this.changeMarker_( arg.name, arg.coordinate, arg.direction );
        }, this );

        this.app.on( 'living:connected', function ( e ) {
            this._element.querySelector( _CLOSE_BUTTON_SELECTOR ).style.display = 'none';
            this._element.querySelector( _HANGUP_BUTTON_SELECTOR ).style.display = 'block';
        }, this );


        this.app.on( 'living:disconnected', function ( e ) {
            this._element.querySelector( _CLOSE_BUTTON_SELECTOR ).style.display = 'block';
            this._element.querySelector( _HANGUP_BUTTON_SELECTOR ).style.display = 'none';
            this.closeScreen_();
        }, this );

        this.app.on( [ 'marker:changed', 'remoate:marker:changed' ], function ( e ) {
            var arg = e.argument;
            this.changeMarker_( arg.name, arg.coordinate, arg.direction );
        }, this );

        this.app.on( [ 'remoate:view:changed' ], function ( e ) {
            var arg = e.argument;
            this.changeView_( arg.url, arg.extent, arg.title );
        }, this );

    };

    /**
     * 打开直播视频窗口
     *
     * @private
     */
    Screen.prototype.openScreen_ = function ( house ) {

        this._direction = undefined;

        if ( this._element === null )
            this.buildView_();

        if ( this._map === null )
            this.initMap_();

        if ( this._video === null )
            this.initVideo_();

        if ( this._house && this._house.url === house.url ) {
            this._house = house;
            this.dispatchEvent( new ifuture.Event( 'screen:opened' ) );
            return;
        }

        this._house = house;
        this.buildHouseMap_( house.views );
    };

    /**
     * 显示直播视频
     *
     * @private
     */
    Screen.prototype.onScreenOpened_ = function () {

        this._element.style.display = 'block';

        var callee = this._house.callee;

        // 主播模式，向观众进行直播
        if ( ! callee ) {
            var heading = this._sensor.getHeading();
            // 设备不支持指南针
            if ( heading === undefined ) {
                var marker = this._map.getOverlayById( _MARKER_ID );
                marker.getElement().src = _LOCATION_MARKER_URL;
                this._direction = null;
            }
            else {
                this._direction = heading;
                marker.getElement().src = _LOCATION_MARKER_HEADING_URL;
                this._sensor.on( 'change:heading', this.onHeadingChanged_, this );
            }
            var argument = {
                video: this._video.querySelector( 'video' ),
            };
            this.dispatchEvent( new ifuture.Event( 'start:living', argument ) );
        }

        // 观众模式，呼叫主播，观看直播
        else {
            this._direction = undefined;
            var argument = {
                video: this._video.querySelector( 'video' ),
                callee: callee,
            };
            this.dispatchEvent( new ifuture.Event( 'watch:living', argument ) );
        }

    };

    /**
     * 关闭直播视频，还没有开始通话
     *
     * @private
     */
    Screen.prototype.closeScreen_ = function () {
        this.dispatchEvent( new ifuture.Event( 'screen:closed' ) );
    };

    /**
     * 挂断直播视频，正在直播的过程中
     *
     * @private
     */
    Screen.prototype.hangup_ = function () {
        this.dispatchEvent( new ifuture.Event( 'disconnect:living' ) );
    };

    /**
     * 创建页面对象
     *
     * @private
     */
    Screen.prototype.buildView_ = function () {

        this._element = document.querySelector( _SELECTOR );
        this._element.innerHTML = _TEMPLATE;

        var div = document.createElement( 'DIV' );
        div.innerHTML = _FRAME_DIALOG_TEMPLATE;
        this._element.appendChild( div.firstElementChild );

        // 内部事件绑定
        var scope = this;

        this._sensor.on( 'error', function () {
            logger.log( 'geolocation error' );
        } );

        this._element.querySelector( _CLOSE_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.closeScreen_();
        }, false );

        this._element.querySelector( _HANGUP_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.hangup_();
        }, false );

        Array.prototype.forEach.call( this._element.querySelectorAll( _FRAME_BUTTONS_SELECTOR ), function ( button ) {
            button.addEventListener( 'click', scope.onChangeView_.bind( scope ), false );
        } );

    };

    /**
     * 创建视频对象
     *
     * @private
     */
    Screen.prototype.initVideo_ = function () {
        var element = document.createElement( 'DIV' );
        element.innerHTML = _VIDEO_TEMPLATE;
        element = element.firstElementChild;
        this._element.appendChild( element );

        var video = element.querySelector( 'video' );
        video.width = window.innerWidth;
        video.height = window.innerHeight;
        this._video = element;

        window.addEventListener( 'resize', function ( e ) {
            video.width = element.clientWidth;
            video.height = element.clientHeight;
        }, false );

    };

    /**
     * 创建房屋结构图
     *
     * @private
     */
    Screen.prototype.initMap_ = function () {

        var img = document.createElement( 'IMG' );
        img.src = _LOCATION_MARKER_URL;
        var marker = new ol.Overlay({
            id: _MARKER_ID,
            element: img,
            positioning: 'center-center',
            stopEvent: false,
        });

        var element = document.createElement( 'DIV' );
        element.className = 'dx-overview dx-mini';
        this._element.appendChild( element );
        this._map = new ol.Map( {
            target: element,
            interactions: [],
            controls: [],
            overlays: [ marker ],
        } );

        this._map.on( 'singleclick', this.onTouchMap_, this );

    };


    /**
     * 创建地图的图层和视图
     *
     * @private
     */
    Screen.prototype.buildHouseMap_ = function ( views ) {

        var view = views[ 0 ];

        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( view.geometry );
        var extent = geometry.getExtent();

        var size = this._map.getSize();
        if ( size === undefined || size[ 0 ] === 0 || size[ 1 ] === 0 ) {
            size = _DEFAULT_MAP_SIZE;
            this._map.setSize( size );
        }

        var resolution = Math.max( ol.extent.getWidth( extent ) / size[ 0 ], ol.extent.getHeight( extent ) / size[ 1 ] );
        var center = ol.extent.getCenter( extent );
        this._map.setView( new ol.View( {
            enableRotation: false,
            resolutions: [ resolution ],
            center: center,
            resolution: resolution,
        } ) );

        var loadImage = function ( image, src ) {
            image.getImage().src = src;
        };

        var source = new ol.source.ImageStatic( {
            crossOrigin: 'anonymous',
            imageExtent: extent,
            url: view.url,
            imageLoadFunction: loadImage,
        } );

        var layer = new ol.layer.Image( {
            extent: extent,
            source: source,
        } );
        this._map.setLayerGroup( new ol.layer.Group( { layers: [ layer ] } ) );

        source.on( 'imageloadend', function ( e ) {
            this.dispatchEvent( new ifuture.Event( 'screen:opened' ) );
        }, this );

        source.on( 'imageloaderror', function ( e ) {
            logger.log( 'Load static image to map failed: ' + e );
            dialog.info( '无法打开房屋的结构图' );
        }, this );

    };

    /**
     * 导航地图点击事件的处理函数
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     * @private
     */
    Screen.prototype.onTouchMap_ = function ( evt ) {

        var marker = this._map.getOverlayById( _MARKER_ID );
        marker.setPosition( evt.coordinate );

        var data = {
            name: _MARKER_ID,
            coordinate: evt.coordinate,
            direction: this._direction,
        };
        this.dispatchEvent( new ifuture.Event( 'send:anchor', data ) );

    };

    /**
     * 设备角度发生变化之后
     *
     * @param {ol.Object.Event} evt 对象事件
     * @private
     */
    Screen.prototype.onHeadingChanged_ = function ( evt ) {

        var marker = this._map.getOverlayById( _MARKER_ID );
        var element = marker.getElement();

        var direction = this._sensor.getHeading();
        if ( direction === undefined ) {
            this._direction = false;
            logger.log( 'Sensor can not get heading' );
            return;
        }
        this._direction = direction;

        var rotate = 'rotate(' + direction + 'rad)';
        element.style.transform = rotate;
        element.style.webkitTransform = rotate;
        element.style.mozTransform = rotate;
        element.style.msTransform = rotate;

        var data = {
            name: 'marker',
            coordinate: marker.getPostion(),
            direction: direction,
        };
        this.dispatchEvent( new ifuture.Event( 'send:anchor', data ) );

    };

    /**
     * 设备角度发生变化之后
     *
     * @param {String} name 标志对象名称
     * @param {Array.<number>} coordinate 所在的位置坐标
     * @param {number} direction 和正北的角度差，弧度值
     * @private
     */
    Screen.prototype.changeMarker_ = function ( name, coordinate, direction ) {

        var marker = this._map.getOverlayById( name );
        var element = marker.getElement();
        if ( marker ) {
            if ( this._direction === undefined ) {
                element.src = direction === null ? _LOCATION_MARKER_HEADING_URL : _LOCATION_MARKER_URL;
            }
            this._direction = direction;

            marker.setPosition( coordinate );
            if ( this._direction !== null ) {
                var rotate = 'rotate(' + direction + 'rad)';
                element.style.transform = rotate;
                element.style.webkitTransform = rotate;
                element.style.mozTransform = rotate;
                element.style.msTransform = rotate;
            }
        }
    };

    /**
     * 导航视图发生了变化
     *
     * @param {URL} src 导航视图对应的图片地址
     * @param {Array.<number>} extent 图片对应的区域
     * @param {String|undefined} title 导航视图标题
     * @private
     */
    Screen.prototype.changeView_ = function ( url, extent, title ) {

        var loadImage = function ( image, src ) {
            image.getImage().src = src;
        };

        var source = new ol.source.ImageStatic( {
            crossOrigin: 'anonymous',
            imageExtent: extent,
            url: url,
            imageLoadFunction: loadImage,
        } );

        var layer = new ol.layer.Image( {
            extent: extent,
            source: source,
        } );
        this._map.setLayerGroup( new ol.layer.Group( { layers: [ layer ] } ) );

        this.dispatchEvent( new ifuture.Event( 'show:loader' ) );
        source.on( 'imageloadend', function ( e ) {
            this.dispatchEvent( new ifuture.Event( 'hide:loader' ) );
            var view = this._map.getView();
            var resolution = view.getResolutionForExtent( extent );
            var center = ol.extent.getCenter( extent );
            view.setCenter( center );
            view.setResolution( resolution );
        }, this );

        source.on( 'imageloaderror', function ( e ) {
            this.dispatchEvent( new ifuture.Event( 'hide:loader' ) );
            logger.log( 'Load static image to map failed: ' + e );
            dialog.info( '无法打开导航图' );
        }, this );

    };

    /**
     * 切换到其他视图
     *
     * @private
     */
    Screen.prototype.onChangeView_ = function ( e ) {

        var getViewData = function ( views, type ) {
            for ( var i = 0; i < views.length; i ++ ) {
                if ( views[ i ].type === type )
                    return views[ i ];
            }
            return views[ 0 ];
        };

        var button = e.currentTarget;
        var type = button.getAttribute( 'view-type' );
        var index = parseInt( button.getAttribute( 'view-index' ) );

        var view;
        var house = this._house;
        var locations = house.locations;
        var fmt = new ol.format.WKT();
        if ( index === 0 ) {
            view = getViewData( this._house.views, type );
        }
        else if ( locations && locations.length && locations.length >= index ) {
            view = getViewData( locations.slice( - index )[ 0 ].views, type );
        }

        if ( view ) {
            var geometry = fmt.readGeometry( view.geometry );
            var extent = geometry.getExtent();
            var url = view.url;
            this.changeView_( url, extent );
            this.dispatchEvent( new ifuture.Event( 'send:view', {
                src: url,
                extent: extent,
            } ) );
        }
        else {
            dialog.info( '打开导航视图失败' );
        }

    };

    return Screen;

} );
