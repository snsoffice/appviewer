define( [ 'ifuture', 'config', 'ol', 'app/dialog' ], function ( ifuture, config, ol, dialog ) {

    var _TEMPLATE = '                                                             \
        <div class="dx-tab bg-secondary">                                         \
         <div class="dx-view-tool mx-3 mb-2">                                     \
           <button class="btn btn-outline-secondary border-0 mr-2" type="button"> \
             <i class="fas fa-th fa-lg"></i>                                      \
           </button>                                                              \
         </div>                                                                   \
       </div>';

    var _MARKER_TEMPLATE = '                                         \
        <div class="dx-house-locator">                               \
          <span class="bg-danger rounded-circle border-dark"></span> \
        </div>';

    var _CATALOG_TEMPLATE = '                                                                                          \
        <button type="button" data-action="show" class="btn btn-sm btn-outline-light m-2">全部显示</button>        \
        <button type="button" data-action="hide" class="btn btn-sm btn-outline-light m-2">全部隐藏</button>        \
        <button type="button" data-catalog="transport" class="btn btn-sm btn-outline-light m-2">交通出行</button>  \
        <button type="button" data-catalog="food" class="btn btn-sm btn-outline-light m-2">饭店美食</button>       \
        <button type="button" data-catalog="shopping" class="btn btn-sm btn-outline-light m-2">超市商店</button>   \
        <button type="button" data-catalog="school" class="btn btn-sm btn-outline-light m-2">学校教育</button>     \
        <button type="button" data-catalog="hospital" class="btn btn-sm btn-outline-light m-2">医院卫生</button>   \
        <button type="button" data-catalog="goverment" class="btn btn-sm btn-outline-light m-2">政府机关</button>';

    var _MARKER_ID = 'marker';

    var _TOGGLE_CATALOG_SELECTOR = 'div.dx-view-tool > button:nth-of-type(1)';

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
            this.show_();
            return ;
        }

        if ( this._element === null )
            this.buildView_();

        if ( this._map === null )
            this.buildMap_();

        this.buildHouseFeature_();

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
     * 显示地理位置窗口
     *
     * @private
     */
    View.prototype.show_ = function () {

        this._element.style.display = 'block';

        if ( this._map ) {
            var size = this._map.getSize();
            if ( size === undefined || size[ 0 ] === 0 || size[ 1 ] === 0 ) {
                this._map.updateSize();
            }
        }

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

        this._element.querySelector( _TOGGLE_CATALOG_SELECTOR ).addEventListener( 'click', this.showCatalog_.bind( this ), false );

    };

    /**
     * 初始化地图
     *
     * @private
     */
    View.prototype.buildMap_ = function () {

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

    };

    /**
     * 装载房子相关的周边设施
     *
     * @private
     */
    View.prototype.buildHouseFeature_ = function () {

        var view = this._data.locations.slice( -1 )[ 0 ].frames[ 0 ];
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

        var toCoordinate = function ( str ) {
            var result = [];
            str.split( ',' ).forEach( function ( a ) {
                result.push( parseFloat( a ) );
            } );
            return result;
        };

        var center = toCoordinate( this._data.coordinate );
        this._map.getOverlayById( _MARKER_ID ).setPosition( center );

    };

    /**
     * 显示分类对话框
     *
     * @private
     */
    View.prototype.showCatalog_ = function () {
        dialog.picker( _CATALOG_TEMPLATE, function ( e ) {
            console.log( e.currentTarget.innerHTML );
        }, true );
    };

    return View;

} );
