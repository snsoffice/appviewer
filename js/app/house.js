define( [ 'ifuture', 'config', 'restapi',
          'app/plugins/info', 'app/plugins/frame', 'app/plugins/photo',
          'app/plugins/location', 'app/plugins/feature', 'app/plugins/panel' ],
function ( ifuture, config, restapi,
           HouseInfo, HouseFrame, HousePhoto, HouseLocation, HouseFeature, HousePanel ) {

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
                <a class="nav-item nav-link" data-view="info" href="#">基本信息</a>              \
                <a class="nav-item nav-link" data-view="frame" href="#">房屋结构</a>             \
                <a class="nav-item nav-link" data-view="photo" href="#">照片全景</a>             \
                <a class="nav-item nav-link" data-view="location" href="#">地理位置</a>          \
                <a class="nav-item nav-link" data-view="feature" href="#">周边环境</a>           \
                <a class="nav-item nav-link" data-view="panel" href="#">直播看房</a>             \
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
         * 所有的视图
         * @private
         * @type {Object}
         */
        this._views = {
            current: null,
            info: new HouseInfo( app, _SELECTOR ),
            frame: new HouseFrame( app, _SELECTOR ),
            location: new HouseLocation( app, _SELECTOR ),
            photo: new HousePhoto( app, _SELECTOR ),
            feature: new HouseFeature( app, _SELECTOR ),
            panel: new HousePanel( app, _SELECTOR ),
        };

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

            if ( this._element === null )
                this.buildHouseViewer_();
            else
                this.show_();
            this.openHouse_( e.argument );

        }, this );

        this.app.on( 'close:house', function ( e ) {
            this.closeHouse_();
        }, this );

        this.app.on( 'view:panel', function ( e ) {
            this.showView_( 'panel' );
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
    House.prototype.openHouse_ = function ( url ) {

        if ( this._url === url ) {
            this.dispatchEvent( new ifuture.Event( 'house:opened' ) );
            return;
        }

        this._url = url;
        this.showView_( 'info' );
        this.dispatchEvent( new ifuture.Event( 'house:opened' ) );

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
                    scope.showView_( e.currentTarget.getAttribute( 'data-view' ) );
                }, false );
        } );

        this._element = element;

    };

    /**
     * 显示房屋视图
     *
     * @private
     */
    House.prototype.showView_ = function ( name ) {

        var view = this._views[ name ];

        if ( this._views.current === view )
            return;

        if ( this._views.current !== null )
            this._views.current.close();

        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = view.title;
        view.open( this._url );
        this._views.current = view;

    };

    return House;

} );