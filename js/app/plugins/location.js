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

    var _MARKER_TEMPLATE = '                                                                  \
        <div class="dx-house-locator">                                                        \
          <img class="border border-info rounded-circle img-fluid" src="%SRC%" alt="%TITLE%"> \
          <span class="bg-danger rounded-circle border-dark"></span>                          \
        </div>';

    var _FRAME_SELECTOR = 'div.dx-frame';
    var _INDICATOR_SELECTOR = 'ol.carousel-indicators > li';

    var _MARKER_IMAGE_SELECTOR = 'img';
    var _MARKER_INDICATOR_SELECTOR = 'span';

    var _HOUSE_MARKER_ID = 'myhouse';

    var _BINGS_MAP_KEY = 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb';

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
         * 动画设置的数据信息
         * @private
         * @type {Array.<Object>}
         */
        this._animations = null;


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
     * 创建地图对象
     *
     * @private
     */
    View.prototype.buildMap_ = function () {

        var size = [ window.innerWidth, window.innerHeight - _PADDING_TOP ];
        var fmt = new ol.format.WKT();

        var view = this._data.views[ 0 ];
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
        element.style.display = 'none';
        marker.setPosition( ol.extent.getCenter( extent ) );

        var layers = [];
        layers.push( this.buildImageLayer_( view.url, extent ) );

        if ( this._data.locations && this._data.locations.length ) {
            this._data.locations.forEach( function ( building ) {
                view = building.views[ 0 ];
                geometry = fmt.readGeometry( view.geometry );
                extent = geometry.getExtent();
                layers.push( this.buildImageLayer_( view.url, extent ) );
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
        } ) );

        this._map.getView().fit( extent, {
            padding: [ 16, 0, 16, 0 ],
        } );

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

        this.select_( index );

        if ( index === 2 ) {
            this.showHouse_();
            return;
        }

        var marker = this._map.getOverlayById( _HOUSE_MARKER_ID );
        marker.getElement().style.display = 'none';

        
    };

    /**
     * 默认在小区中显示房子的位置
     *
     * @private
     */
    View.prototype.showHouse_ = function () {

        if ( this._map === null || this._animations === null )
            return;

        var marker = this._map.getOverlayById( _HOUSE_MARKER_ID );
        marker.getElement().style.display = 'block';

        var center = this._animations[ 1 ].center;
        var resolution = this._animations[ 1 ].resolution;

        this._map.getView().animate( {
            center: center,
            resolution: resolution,
            duration: 100,
        } );

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
     * 选中指示器
     *
     * @private
     */
    View.prototype.onResize_ = function ( e ) {

        if ( this._map === null )
            return;
        this._map.setSize( [ window.innerWidth, window.innerHeight - _PADDING_TOP ] );

    };

    return View;

} );
