define( [ 'ifuture', 'config', 'ol' ], function ( ifuture, config, ol ) {

    var _PADDING_TOP = 56;

    var _TEMPLATE = '                                                                \
      <div class="dx-tab bg-secondary ">                                             \
        <div class="dx-frame w-100 h-100">                                           \
        </div>                                                                       \
         <ol class="carousel-indicators">                                            \
           <li data-slide-to="1"></li>                                               \
           <li data-slide-to="2"></li>                                               \
           <li data-slide-to="3"></li>                                               \
         </ol>                                                                       \
      </div>';

    var _MARKER_TEMPLATE = '                                                                     \
        <div class="dx-house-locator">                                                           \
          <img class="border border-primary rounded-circle img-fluid" src="%SRC%" alt="%TITLE%"> \
          <span class="bg-danger rounded-circle border-dark"></span>                             \
        </div>';

    var _FRAME_SELECTOR = 'div.dx-frame';
    var _INDICATOR_SELECTOR = 'ol.carousel-indicators > li';

    var _MARKER_IMAGE_SELECTOR = 'img';
    var _MARKER_INDICATOR_SELECTOR = 'span';

    var _HOUSE_MARKER_ID = 'myhouse';

    var _BINGS_MAP_KEY = 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb';

    var _MIN_INDEX = 1;
    var _MID_INDEX = 2;
    var _MAX_INDEX = 3;

    var _DEFAULT_EXTENT_RATIO = 0.8;
    var _FADE_EXTENT_RATIO = 0.6;
    var _HIDE_EXTENT_RATIO = 0.2;

    var _TOP_VIEW_RESOLUTION = 3000;

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '位置风水';

        /**
         * 父视图的选择符
         * @private
         * @type {String}
         */
        this._target = target;

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._element = null;

        /**
         * 当前对应房子的地址
         * @private
         * @type {String}
         */
        this._url = null;

        /**
         * 房子的属性数据
         * @private
         * @type {Object}
         */
        this._data = null;

        /**
         * 显示位置的地图
         * @private
         * @type {ol.Map}
         */
        this._map = null;

        /**
         * 各层的区域
         * @private
         * @type {Array.<ol.Extent>}
         */
        this._extents = null;


        // Resize map
        window.addEventListener( 'resize', this.onResize_.bind( this ), false );

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开房子地理位置窗口
     *
     * @public
     */
    View.prototype.open = function ( url, data, options ) {

        this._data = data;

        if ( this._url === url ) {
            this._element.style.display = 'block';
            return ;
        }

        if ( this._element !== null )
            this._element.remove();

        // this.dispatchEvent( new ifuture.Event( 'show:loader' ) );

        this.buildView_();
        this.buildMap_();

        this._element.style.display = 'block';
        this._url = url;

    };

    /**
     * 关闭房屋地理位置窗口
     *
     * @public
     */
    View.prototype.close = function () {

        this._element.style.display = 'none';

    }

    /**
     * 创建页面对象
     *
     * @private
     */
    View.prototype.buildView_ = function () {

        var element = document.createElement( 'DIV' );
        element.innerHTML = _TEMPLATE;
        element = element.firstElementChild;
        document.querySelector( this._target ).appendChild( element );
        this._element = element;

        var scope = this;
        Array.prototype.forEach.call( element.querySelectorAll( _INDICATOR_SELECTOR ), function ( li ) {
            li.addEventListener( 'click', function ( e ) {
                scope.animateHouse_( parseInt( e.currentTarget.getAttribute( 'data-slide-to' ) ) );
            }, false );
        } );

    };

    /**
     * 得到对应的视图，
     *
     * @private
     */

    View.prototype.getViewData_ = function ( data ) {

        var views = data.views;
        if ( views && views.length ) {
            for ( var i = 0; i < views.length; i ++ ) {
                if ( views[ i ].type === 'solid' )
                    return views[ i ];
            }
            return views[ 0 ];
        }

    };

    /**
     * 创建地图对象
     *
     * @private
     */
    View.prototype.buildMap_ = function () {

        var view = this.getViewData_( this._data );

        var size = [ window.innerWidth, window.innerHeight - _PADDING_TOP ];
        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( view.geometry );
        var extent = geometry.getExtent();

        var element = document.createElement( 'div' );
        element.innerHTML = _MARKER_TEMPLATE.replace( '%SRC%', view.url ).replace( '%TITLE%', view.name );
        element = element.firstElementChild;
        var marker = new ol.Overlay({
            id: _HOUSE_MARKER_ID,
            element: element,
            positioning: 'center-center',
            stopEvent: false,
        });
        marker.setPosition( ol.extent.getCenter( extent ) );

        this._extents = [];
        this._extents.push( extent );

        var layers = [];
        layers.push( this.buildImageLayer_( view.url, extent ) );

        if ( this._data.locations && this._data.locations.length ) {
            this._data.locations.forEach( function ( building ) {

                view = this.getViewData_( building );
                if ( view === undefined )
                    return;

                geometry = fmt.readGeometry( view.geometry );
                extent = geometry.getExtent();
                layers.push( this.buildImageLayer_( view.url, extent ) );
                this._extents.push( extent );

            }, this );
        }

        layers.push(
            new ol.layer.Tile( {
                preload: Infinity,
                source: new ol.source.BingMaps( {
                    key: _BINGS_MAP_KEY,
                    imagerySet: 'Aerial',
                    // use maxZoom 19 to see stretched tiles instead of the BingMaps
                    // "no photos at this zoom level" tiles
                    maxZoom: 19
                } )
            } ) );
        layers.reverse();

        var target = this._element.querySelector( _FRAME_SELECTOR );
        this._map = new ol.Map( {
            target: target,
            layers: layers,
            // interactions: [],
            controls: [],
            overlays: [ marker ],
        } );

        this._map.setSize( size );
        this._map.setView( new ol.View( {
            enableRotation: false,
            extent: this._extents[ 0 ],
        } ) );

        // 没有这一行地图显示不出来，不知道原因，必须使用 padding 选项
        this._map.getView().fit( extent, { padding: [ 0, 0, 0, 0 ] } );
        this.showHouse_();

    };

    /**
     * 创建静态图片的图层
     *
     * @private
     */
    View.prototype.buildImageLayer_ = function ( src, extent ) {

        var loadImage = function ( image, src ) {
            image.getImage().src = src;
        };

        var source = new ol.source.ImageStatic( {
            crossOrigin: 'anonymous',
            imageExtent: extent,
            url: src,
            imageLoadFunction: loadImage,
        } );

        return new ol.layer.Image( {
            extent: extent,
            source: source,
        } );

    };

    /**
     * 动画方式显示房子在建筑物、小区以及省、国家等大区域的位置
     *
     *
     * @private
     */
    View.prototype.animateHouse_ = function ( index ) {

        if ( this._map === null || this._extents === null || index < _MIN_INDEX || index > _MAX_INDEX )
            return;

        if ( index === _MID_INDEX ) {
            this.showHouse_();
            return;
        }

        this.select_( index );

        var view = this._map.getView();
        if ( view.getAnimating() )
            view.cancelAnimations();

        this.setMarkerVisible_( false, true );
        view.animate.apply( view, this.buildAnimate_( index ) );

    };

    /**
     * 默认在小区中显示房子的位置
     *
     * @private
     */
    View.prototype.showHouse_ = function () {

        this.select_( _MID_INDEX );

        if ( this._map === null || this._extents === null )
            return;

        this.setMarkerVisible_( true, false );

        var view = this._map.getView();
        if ( view.getAnimating() )
            view.cancelAnimations();

        // 显示小区图
        var layers = this._map.getLayers();
        layers.forEach( function ( layer ) {
            layer.setOpacity( 0 );
        } );
        layers.item( 1 ).setOpacity( 1 );

        var extent = this._extents.slice( -1 )[ 0 ];
        var resolution = view.getResolutionForExtent( extent ) / _DEFAULT_EXTENT_RATIO;
        view.setCenter( ol.extent.getCenter( extent ) );
        view.setResolution( resolution );

    };

    /**
     * 显示房子的不同图标
     *
     * @private
     */
    View.prototype.setMarkerVisible_ = function ( big, small ) {
        var element = this._map.getOverlayById( _HOUSE_MARKER_ID ).getElement();
        element.querySelector( _MARKER_IMAGE_SELECTOR ).style.display = big ? 'block' : 'none';
        element.querySelector( _MARKER_INDICATOR_SELECTOR ).style.display = small ? 'block' : 'none';
    };

    /**
     * 选中指示器
     *
     * @private
     */
    View.prototype.select_ = function ( index ) {

        Array.prototype.forEach.call( this._element.querySelectorAll( _INDICATOR_SELECTOR ), function ( li ) {
            li.className = '';
        } );
        this._element.querySelector( _INDICATOR_SELECTOR + ':nth-of-type(' + index + ')' ).className = 'active';

    };

    /**
     * 屏幕尺寸发生变化
     *
     * @private
     */
    View.prototype.onResize_ = function ( e ) {

        if ( this._map === null )
            return;
        this._map.setSize( [ window.innerWidth, window.innerHeight - _PADDING_TOP ] );

    };


    /**
     * 缩放区域
     *
     * @private
     */
    View.prototype.zoomExtent_ = function ( extent, ratio ) {
        var r = ratio === undefined ? _DEFAULT_EXTENT_RATIO : ratio;
        var center = ol.extent.getCenter( extent );
        var dx = ol.extent.getWidth( extent ) * r;
        var dy = ol.extent.getHeight( extent ) * r;
        return [ center[ 0 ] - dx, center[ 1 ] - dy, center[ 0 ] + dx, center[ 1 ] + dy ];
    };

    /**
     * 创建动画演示方式
     *
     * @private
     */
    View.prototype.buildAnimate_ = function ( index ) {

        var view = this._map.getView();

        if ( index === _MIN_INDEX ) {

            var animations = [];
            var layers = this._map.getLayers();
            var j = layers.getLength() - 1;

            var extent = this._extents[ 0 ];
            var resolution = view.getResolutionForExtent( extent );

            layers.item( 0 ).setOpacity( 0 );
            layers.item( j ).setOpacity( 1 );

            animations.push( {
                center: ol.extent.getCenter( extent ),
                resolution: resolution / _DEFAULT_EXTENT_RATIO,
                duration: 3000,
            } );

            animations.push( {
                resolution: resolution / _FADE_EXTENT_RATIO,
                duration: 2000,
            } );

            animations.push( {
                resolution: resolution / _HIDE_EXTENT_RATIO,
                duration: 2000,
                easing: function ( t ) {
                    layers.item( 2 ).setOpacity( t );
                    layers.item( j ).setOpacity( 1 - t );
                    return  ol.easing.inAndOut( t );
                }
            } );

            extent = this._extents.slice( -2 )[ 0 ];
            resolution = view.getResolutionForExtent( extent );
            animations.push( {
                center: ol.extent.getCenter( extent ),
                resolution: resolution / _DEFAULT_EXTENT_RATIO,
                duration: 2000,
            } );
            animations.push( {
                resolution: resolution / _FADE_EXTENT_RATIO,
                duration: 2000,
                easing: function ( t ) {
                    layers.item( 1 ).setOpacity( t );
                    return  ol.easing.inAndOut( t );
                },
            } );
            animations.push( {
                resolution: resolution / _HIDE_EXTENT_RATIO,
                duration: 2000,
                easing: function ( t ) {
                    layers.item( 2 ).setOpacity( 1 - t );
                    return  ol.easing.inAndOut( t );
                },
            } );

            extent = this._extents.slice( -1 )[ 0 ];
            resolution = view.getResolutionForExtent( extent ) / _DEFAULT_EXTENT_RATIO;
            animations.push( {
                center: ol.extent.getCenter( extent ),
                resolution: resolution,
                duration: 3000,
            } );

            animations.push( this.showHouse_.bind( this ) );
            return animations;

        }

        else if ( index === _MAX_INDEX ) {
            var extent = this._extents.slice( -1 )[ 0 ];
            var resolution = view.getResolutionForExtent( extent );

            var layer = this._map.getLayers().item( 0 );
            layer.setMinResolution( resolution / _DEFAULT_EXTENT_RATIO );
            layer.setOpacity( 0 );

            var animation1 = {
                center: ol.extent.getCenter( extent ),
                resolution: resolution / _DEFAULT_EXTENT_RATIO,
                duration: 100,
            };

            var animation2 = {
                resolution: resolution / _FADE_EXTENT_RATIO,
                duration: 5000,
                easing: function ( t ) {
                    layer.setOpacity( t );
                    return  ol.easing.inAndOut( t );
                }
            };

            var animation3 = {
                resolution: resolution / _HIDE_EXTENT_RATIO,
                duration: 5000,
            };

            var animation4 = {
                resolution: _TOP_VIEW_RESOLUTION,
                duration: 8000,
            };

            return [ animation1, animation2, animation3, animation4 ];
        }

    };

    return View;

} );
