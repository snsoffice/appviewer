define( [ 'ifuture', 'config', 'restapi', 'logger', 'app/dialog', 'app/slider',
          'app/plugins/info', 'app/plugins/frame', 'app/plugins/photo',
          'app/plugins/location', 'app/plugins/feature', 'app/plugins/panel' ],
function ( ifuture, config, restapi, logger, dialog, Slider,
           HouseInfo, HouseFrame, HousePhoto, HouseLocation, HouseFeature, HousePanel ) {

    var _HOUSE_CONFIG_FILE = 'config.json';
    var _SLIDE_EVENT_NAME = 'slide:view';
    var _PANEL_VIEW_INDEX = 5;

    var _SELECTOR = '.dx-viewer';

    var _NAVBAR_BRAND_SELECTOR = '.navbar-brand';
    var _NAVBAR_TITLE_SELECTOR = 'nav.navbar > span.navbar-text';
    var _NAVBAR_MENU_SELECTOR = '.navbar-collapse.collapse';
    var _NAVBAR_MENUITEM_SELECTOR = 'nav.navbar.fixed-top .navbar-nav a';

    var _TEMPLATE = '                                                                            \
        <div id="viewer" class="dx-viewer">                                                      \
          <nav class="navbar navbar-expand-md fixed-top navbar-dark bg-dark">                    \
            <a class="navbar-brand" href="#"><i class="fas fa-arrow-left"></i>&nbsp;远景看房</a> \
            <span class="navbar-text mx-auto d-md-none d-lg-block">基本信息</span>               \
            <button class="navbar-toggler" type="button" data-toggle="collapse"                  \
                    data-target="#menu-viewer" aria-controls="menu-viewer" aria-expanded="false" \
                    aria-label="Toggle menu">                                                    \
              <span class="navbar-toggler-icon"></span>                                          \
            </button>                                                                            \
            <div class="collapse navbar-collapse" id="menu-viewer">                              \
              <div class="navbar-nav ml-auto text-center">                                       \
                <a class="nav-item nav-link" data-index="0" href="#">基本信息</a>                \
                <a class="nav-item nav-link" data-index="1" href="#">房屋结构</a>                \
                <a class="nav-item nav-link" data-index="2" href="#">照片全景</a>                \
                <a class="nav-item nav-link" data-index="3" href="#">位置风水</a>                \
                <a class="nav-item nav-link" data-index="4" href="#">周边设施</a>                \
                <a class="nav-item nav-link" data-index="5" href="#">直播看房</a>                \
              </div>                                                                             \
            </div>                                                                               \
          </nav>                                                                                 \
        </div>';

    House = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._element = null;

        /**
         * 当前打开房子的地址
         * @private
         * @type {String}
         */
        this._url = null;

        /**
         * 房屋的配置数据
         * @private
         * @type {Object}
         */
        this._data = null;

        /**
         * 房屋的额外属性，例如主播等
         * @private
         * @type {Object}
         */
        this._options = undefined;

        /**
         * 在手机左右滑动切换视图的控件
         * @private
         * @type {ifuture.Slider}
         */
        this._slider = null;

        /**
         * 所有的视图
         * @private
         * @type {Array.<HouseView>}
         */
        this._views = [
            new HouseInfo( app, _SELECTOR ),
            new HouseFrame( app, _SELECTOR ),
            new HousePhoto( app, _SELECTOR ),
            new HouseLocation( app, _SELECTOR ),
            new HouseFeature( app, _SELECTOR ),
            new HousePanel( app, _SELECTOR ),
        ];

        /**
         * 当前视图的索引
         * @private
         * @type {number}
         */
        this._index = -1;

    }
    ifuture.inherits( House, ifuture.Component );

    /**
     *
     * 事件绑定程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @observable
     * @api
     */
    House.prototype.bindFutureEvent = function () {

        this.app.on( 'open:house', function ( e ) {

            this.openHouse_( e.argument.url, e.argument.view, e.argument.options );

        }, this );

        this.app.on( 'close:house', function ( e ) {
            this.closeHouse_();
        }, this );

        this.app.on( 'screen:opened', function ( e ) {
            this.hide_();
        }, this );

        this.app.on( 'screen:closed', function ( e ) {
            this.show_();
        }, this );

    };

    /**
     * 显示搜索器
     *
     * @private
     */
    House.prototype.show_ = function () {
        this._element.style.display = 'block';
    };

    /**
     * 隐藏搜索器
     *
     * @private
     */
    House.prototype.hide_ = function () {
        this._element.style.display = 'none';
    };

    /**
     * 打开房子
     *
     * @private
     */
    House.prototype.openHouse_ = function ( url, name, options ) {

        if ( this._element === null )
            this.buildHouseViewer_();

        if ( this._url === url ) {
            this.show_();
            this.dispatchEvent( new ifuture.Event( 'house:opened' ) );
            return;
        }

        this._views.forEach( function ( view ) {
            view.close();
        } );

        var scope = this;
        restapi.queryHouseConfig( url + '/' + _HOUSE_CONFIG_FILE )

            .then( function ( data ) {
                scope._data = data;
                scope._url = url;
                scope._options = options;

                scope.show_();
                scope.showView_( name === 'panel' ? _PANEL_VIEW_INDEX : 0 );
                scope.dispatchEvent( new ifuture.Event( 'house:opened' ) );
            } )

            .catch( function ( err ) {
                logger.log( err );
                scope._data = null;
                scope._url = null;
                scope._callee = null;
                dialog.info( '无法打开房屋，读取房屋数据失败' );
            } );

    };

    /**
     * 关闭房子
     *
     * @private
     */
    House.prototype.closeHouse_ = function ( url ) {
        this.hide_();
        this.dispatchEvent( new ifuture.Event( 'house:closed' ) );
    };

    /**
     * 创建页面对象
     *
     * @private
     */
    House.prototype.buildHouseViewer_ = function () {

        var element = document.createElement( 'DIV' );
        element.innerHTML = _TEMPLATE;
        element = element.firstElementChild;
        document.body.appendChild( element );

        this._element = element;
        this._slider = new Slider( element );

        var scope = this;

        element.querySelector( _NAVBAR_BRAND_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.dispatchEvent( new ifuture.Event( 'close:house' ) );
        }, false );

        element.querySelector( _NAVBAR_MENU_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.currentTarget.classList.remove( 'show' );
        }, false );

        Array.prototype.forEach.call( element.querySelectorAll( _NAVBAR_MENUITEM_SELECTOR ), function ( m ) {
                m.addEventListener( 'click', function ( e ) {
                    e.preventDefault();
                    scope.showView_( parseInt( e.currentTarget.getAttribute( 'data-index' ) ) );
                }, false );
        } );

        this._slider.on( _SLIDE_EVENT_NAME, this.onSlideEvent_, this );

    };

    /**
     * 显示房屋视图
     *
     * @private
     */
    House.prototype.showView_ = function ( index ) {

        if ( this._index === index )
            return;

        var view = this._views[ index ];

        if ( this._index !== -1 )
            this._views[ this._index ].hide();

        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = view.title;
        view.open( this._url, this._data, this._options );
        this._index = index;

    };

    /**
     * 左右滑动切换视图事件，事件参数包括两个属性
     *
     *     direction > 0 向右滑动，< 0 向左滑动
     *     touches   触动时候的手指数目
     *
     * @param {ifutre.Event} event
     * @private
     */
    House.prototype.onSlideEvent_ = function ( event ) {

        var index = this._index;
        if ( index === -1 )
            return;

        var view = this._views[ index ];
        var direction = event.argument.direction;
        var fingers = event.argument.fingers;

        if ( typeof view.onSlideView !== 'function' || ! view.onSlideView( direction, fingers ) ) {
            if ( direction > 0 && index > 0 ) {
                this.showView_( index - 1 );
            }
            else if ( direction < 0 && index < this._views.length - 1 ) {
                this.showView_( index + 1 );
            }
        }

    };

    return House;

this.onSlideEvent_
} );
