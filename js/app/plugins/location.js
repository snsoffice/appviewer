define( [ 'ifuture', 'config', 'ol' ], function ( ifuture, config, ol ) {

    var _TEMPLATE = '                                                                \
      <div class="dx-tab bg-secondary ">                                             \
        <div class="dx-frame w-100 h-100">                                           \
        </div>                                                                       \
         <ol class="carousel-indicators">                                            \
           <li data-slide-to="0"></li>                                               \
           <li data-slide-to="1"></li>                                               \
           <li data-slide-to="2"></li>                                               \
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

        this.dispatchEvent( new ifuture.Event( 'show:loader' ) );

        this._element.style.display = 'block';
        this.buildView_();
        this.buildMap_();

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
                switch( e.currentTarget.getAttribute( 'data-slide-to' ) ) {
                case '0':
                    scope.animateBuilding_();
                    break;
                case '2':
                    scope.animateRegion_();
                    break;
                default:
                    scope.showHouse_();
                    break;
                }
            }, false );
        } );

    };

    /**
     * 创建地图对象
     *
     * @private
     */
    Screen.prototype.buildMap_ = function () {

        var src;
        var coordinate;
        var extent;

        var element = document.createElement( 'div' );
        element.innerHTML = _MARKER_TEMPLATE.replace( '%SRC%', src ).replace( '%TITLE%', title );
        element = element.firstElementChild;
        var marker = new ol.Overlay({
            id: _HOUSE_MARKER_ID,
            element: element,
            positioning: 'center-center',
            stopEvent: false,
        });

        var target = this._element.querySelector( _FRAME_SELECTOR );
        this._map = new ol.Map( {
            target: target,
            interactions: [],
            controls: [],
            overlays: [ marker ],
        } );

        var view = new ol.View();
        this._map.setView( view );

        marker.setPosition( coordinate );
    };

    /**
     * 动画方式显示房子在建筑物和小区中的位置
     *
     * @private
     */
    View.prototype.animateBuilding_ = function () {
        this.select_( 1 );
    };

    /**
     * 动画方式显示小区在城市和国家中位置
     *
     * @private
     */
    View.prototype.animateRegion_ = function () {
        this.select_( 2 );
    };

    /**
     * 显示当前房子的信息
     *
     * @private
     */
    View.prototype.showHouse_ = function () {

        if ( this._map === null )
            return;

        var view = this._map.getView();
        view.animate(
            {},
            {},
            function () {
                this.select_( 2 );
            }.bind( this )
        );

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

    return View;

} );
