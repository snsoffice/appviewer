define( [ 'ifuture', 'config', 'logger', 'ol' ], function ( ifuture, config, logger, ol ) {

    var _SELECTOR = '.dx-screen';
    var _CLOSE_BUTTON_SELECTOR = '.dx-toolbar button:nth-of-type(1)';
    var _HANGUP_BUTTON_SELECTOR = '.dx-toolbar button:nth-of-type(2)';

    var _VIDEO_TEMPLATE = '<video autoplay="autoplay" class="w-100 h-100"></video>';

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
        this._element = document.querySelector( _SELECTOR );

        /**
         * 当前对应房子的地址
         * @private
         * @type {String}
         */
        this._url = null;

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
            var arg = e.argument;
            this.openScreen_( arg.url, arg.view, arg.callee );
        }, this );

        this.app.on( 'screen:opend', function ( e ) {
            this._element.style.display = 'block';
        }, this );

        this.app.on( 'screen:closed', function ( e ) {
            this._element.style.display = 'none';
        }, this );

        this.app.on( 'change:anchor', function ( e ) {
            var arg = e.argument;
            this.changeMarker_( arg.name, arg.coordinate, arg.direction );
        }, this );

        this.app.on( 'living:started', function ( e ) {
            this._element.querySelector( _CLOSE_BUTTON_SELECTOR ).style.display = 'none';
            this._element.querySelector( _HANGUP_BUTTON_SELECTOR ).style.display = 'block';
        }, this );

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

    };

    /**
     * 显示直播视频
     *
     * @private
     */
    Screen.prototype.openScreen_ = function ( url, view, callee ) {

        if ( this._map === null )
            this.initMap_();

        if ( this._video === null )
            this.initVideo_();

        if ( this._url === url ) {
            this.dispatchEvent( new ifuture.Event( 'screen:opened' ) );
        }
        else {
            this.buildHouseMap_( view );
            this._url = url;
        }

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
        }

        // 观众模式，呼叫主播，观看直播
        else {
            this._direction = undefined;
            var argument = {
                video: this._video.querySelector( 'video' ),
                callee: callee,
            };
            this.dispatchEvent( new ifutre.Event( 'watch:living', argument ) );
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
        this._element.querySelector( _CLOSE_BUTTON_SELECTOR ).style.display = 'block';
        this._element.querySelector( _HANGUP_BUTTON_SELECTOR ).style.display = 'none';
        this.closeScreen_();
    };

    /**
     * 创建视频对象
     *
     * @private
     */
    Screen.prototype.initVideo_ = function () {
        var video = document.createElement( 'DIV' );
        video.className = 'dx-video w-100 h-100';
        video.innerHTML = _VIDEO_TEMPLATE;
        this._element.appendChild( video );
        this._video = video;
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
            stopEvent: false,
        });

        var element = document.createElement( 'DIV' );
        element.className = 'dx-overview dx-mini';
        this._element.appendChild( element );
        this._map = new ol.Map( {
            target: element,
            interactions: [],
            controls: [],
            overlays: [ marker ];
        } );

        this._map.on( 'singleclick', this.onTouchMap_, this );

    };


    /**
     * 创建地图的图层和视图
     *
     * @private
     */
    Screen.prototype.buildHouseMap_ = function ( view ) {

        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( view.geometry );
        var extent = geometry.getExtent();

        var size = this.map.getSize();
        if ( size === undefined )
            size = _DEFAULT_MAP_SIZE;

        var resolution = Math.max( ol.extent.getWidth( extent ) / size[ 0 ], ol.extent.getHeight( extent ) / size[ 1 ] );
        var center = ol.extent.getCenter( extent );
        var view = new ol.View( {
            enableRotation: false,
            resolutions: [ resolution ],
            center: center,
            resolution: resolution,
        } );
        this._map.setView( view );

        var source = new ol.source.ImageStatic( {
            crossOrigin: 'anonymous',
            imageExtent: extent,
            url: view.url,
        } );

        var layer = new ol.layer.Image( {
            extent: extent,
            source: source,
        } );
        this.map.setLayerGroup( new ol.layer.Group( { layers: [ layer ] } ) );

        source.on( 'propertychange', function ( e ) {

            if ( key === 'state' ) {

                switch ( e.target.getState() ) {

                    case 'ready':
                    this.dispatchEvent( new ifuture.Event( 'screen:opened' ) );
                    break;

                    case 'error':
                    break;

                }

            }

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

        var argument = {
            msgType: 'anchor',
            msgData: {
                name: 'marker',
                coordinate: evt.coordinate,
                direction: this._direction,
            }
        };
        this.dispatchEvent( new ifuture.Event( 'send:anchor', argument ) );

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
        element.style.transform = 'rotate(' + direction + 'rad)';

        var argument = {
            msgType: 'anchor',
            msgData: {
                name: 'marker',
                coordinate: marker.getPostion(),
                direction: direction,
            }
        };
        this.dispatchEvent( new ifuture.Event( 'send:anchor', argument ) );

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
                element.style.transform = 'rotate(' + direction + 'rad)';
            }
        }
    };

    return Screen;

} );
