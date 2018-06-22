define( [ 'ifuture', 'config', 'ol' ], function ( ifuture, config, ol ) {

    var _TEMPLATE = '                                                                     \
        <div class="dx-tab bg-secondary">                                                 \
         <div class="dx-view-tool mx-3 mb-2">                                             \
           <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle mr-2"  \
                   type="button">                                                         \
             <i class="far fa-map fa-lg"></i>                                             \
           </button>                                                                      \
           <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle mr-2"  \
                   data-toggle="modal" data-target="#house-feature-dialog" type="button"> \
             <i class="fas fa-th fa-lg"></i>                                              \
           </button>                                                                      \
         </div>                                                                           \
         <div class="modal fade" id="house-feature-dialog" tabindex="-1" role="dialog"    \
              aria-hidden="true">                                                         \
           <div class="modal-dialog modal-dialog-centered" role="document">               \
             <div class="text-center mx-auto">                                            \
               <div class="p-3 border-bottom border-dark">                                \
                 <button type="button" class="btn btn-default mx-3">全部显示</button>     \
                 <button type="button" class="btn btn-default mx-3">全部隐藏</button>     \
               </div>                                                                     \
               <div class="p-3">                                                          \
                 <button type="button" class="btn btn-default mx-auto my-2">交通</button> \
                 <button type="button" class="btn btn-default mx-auto my-2">饮食</button> \
                 <button type="button" class="btn btn-default mx-auto my-2">超市</button> \
                 <button type="button" class="btn btn-default mx-auto my-2">学校</button> \
                 <button type="button" class="btn btn-default mx-auto my-2">医院</button> \
                 <button type="button" class="btn btn-default mx-auto my-2">政府</button> \
               </div>                                                                     \
             </div>                                                                       \
           </div>                                                                         \
         </div>                                                                           \
       </div>';

    var _MARKER_TEMPLATE = '                                         \
        <div class="dx-house-locator">                               \
          <span class="bg-danger rounded-circle border-dark"></span> \
        </div>';

    var _MARKER_ID = 'marker';

    var _MINIMAP_SELECTOR = '.dx-overview';
    var _TOGGLE_MINIMAP_SELECTOR = 'div.dx-view-tool > button:nth-of-type(1)';

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '周边设施';

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
         * 显示特征的地图
         * @private
         * @type {ol.Map}
         */
        this._map = null;

        /**
         * 导航迷你地图
         * @private
         * @type {ol.Map}
         */
        this._minimap = null;

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开周边设施窗口
     *
     * @public
     */
    View.prototype.open = function ( url, data, options ) {

        this._data = data;

        if ( this._url === url ) {
            this._element.style.display = 'block';
            return ;
        }

        if ( this._element === null )
            this.buildView_();

        if ( this._map === null )
            this.initMap_();

        this.resetMap_();

        this._url = url;
        this._element.style.display = 'block';

    };

    /**
     * 关闭周边设施窗口
     *
     * @public
     */
    View.prototype.close = function () {

        if ( this._element !== null ) {
            this._element.remove();
            this._element = null;
        }
        this._url = null;
        this._data = null;
        this._map = null;
        this._minimap = null;

    }

    /**
     * 隐藏周边设施窗口
     *
     * @public
     */
    View.prototype.hide = function () {

        this._element.style.display = 'none';

    }

    /**
     * 处理左右滑动切换视图事件
     *
     * @param {number} direction < 0 表示向左滑动，> 0 表示向右滑动
     * @param {number} fingers   触点数目
     *
     * @return {boolean} true 事件已经处理； false 事件没有处理
     *
     * @public
     */
    View.prototype.onSlideView = function ( direction, fingers ) {
        if ( fingers === 1 ) {
            return true;
        }
    };

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

        this._element.querySelector( _TOGGLE_MINIMAP_SELECTOR ).addEventListener( 'click', function ( e ) {

            var m = scope._element.querySelector( _MINIMAP_SELECTOR );
            m.style.display = m.style.display === 'none' ? 'block' : 'none';
            m.querySelector( 'canvas' ).style.display = m.style.display;

        }, false );

    };

    /**
     * 初始化地图
     *
     * @private
     */
    View.prototype.initMap_ = function () {

        var element = document.createElement( 'DIV' );
        element.className = 'dx-page';
        this._element.appendChild( element );

        var div = document.createElement( 'DIV' );
        div.innerHTML = _MARKER_TEMPLATE;
        var marker = new ol.Overlay({
            id: _MARKER_ID,
            element: div.firstElementChild,
            positioning: 'center-center',
            stopEvent: false,
        });

        var baselayer = new ol.layer.Tile( {
            source: new ol.source.OSM()
        } );

        this._map = new ol.Map( {
            target: element,
            controls: [],
            layers: [ baselayer ],
            overlays: [ marker ],
        } );

        var element = document.createElement( 'DIV' );
        element.className = 'dx-overview dx-mini border border-secondary';
        this._element.appendChild( element );

        var div = document.createElement( 'DIV' );
        div.innerHTML = _MARKER_TEMPLATE;
        var marker = new ol.Overlay({
            id: _MARKER_ID,
            element: div.firstElementChild,
            positioning: 'center-center',
            stopEvent: false,
        });

        this._minimap = new ol.PluggableMap( {
            target: element,
            interactions: [],
            controls: [],
            overlays: [],
            overlays: [ marker ],
        } );
        this._minimap.setLayerGroup( this._map.getLayerGroup() );

    };

    /**
     * 装载房子相关的周边设施
     *
     * @private
     */
    View.prototype.resetMap_ = function () {

        var view = this._data.locations.slice( -1 )[ 0 ].views[ 0 ];
        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( view.geometry );
        var extent = geometry.getExtent();
        var size = [ window.innerWidth, window.innerHeight ];
        var resolution = Math.max( ol.extent.getWidth( extent ) / size[ 0 ], ol.extent.getHeight( extent ) / size[ 1 ] );

        this._map.setView( new ol.View( {
            center: ol.extent.getCenter( extent ),
            resolution: resolution * 1.618,
            extent: extent,
        } ) );

        size = [ 200, 150 ];
        resolution = Math.max( ol.extent.getWidth( extent ) / size[ 0 ], ol.extent.getHeight( extent ) / size[ 1 ] );
        this._minimap.setView( new ol.View( {
            center: ol.extent.getCenter( extent ),
            resolution: resolution * 2.7,
            extent: extent,
        } ) );

        var toCoordinate = function ( str ) {
            var result = [];
            str.split( ',' ).forEach( function ( a ) {
                result.push( parseFloat( a ) );
            } );
            return result;
        };

        var center = toCoordinate( this._data.coordinate );
        this._map.getOverlayById( _MARKER_ID ).setPosition( center );
        this._minimap.getOverlayById( _MARKER_ID ).setPosition( center );

    };

    return View;

} );
