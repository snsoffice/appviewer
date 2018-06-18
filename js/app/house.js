define( [ 'ifuture', 'config', 'restapi',
          'app/plugins/info', 'app/plugins/frame', 'app/plugins/photo',
          'app/plugins/location', 'app/plugins/outer', 'app/plugins/panel' ],
function ( ifuture, config, restapi,
           HouseInfo, HouseFrame, HousePhoto, HouseLocation, HouseFeature, HousePanel ) {

    var _SELECTOR = '.dx-viewer';

    var _NAVBAR_BRAND_SELECTOR = '.navbar-brand';
    var _NAVBAR_TITLE_SELECTOR = 'nav.navbar > span.navbar-text';
    var _NAVBAR_MENU_SELECTOR = '.navbar-collapse.collapse';
    var _NAVBAR_INFO_SELECTOR = '.navbar-nav > a:nth-of-type(1)';
    var _NAVBAR_FRAME_SELECTOR = '.navbar-nav > a:nth-of-type(2)';
    var _NAVBAR_PHOTO_SELECTOR = '.navbar-nav > a:nth-of-type(3)';
    var _NAVBAR_LOCATION_SELECTOR = '.navbar-nav > a:nth-of-type(4)';
    var _NAVBAR_FEATURE_SELECTOR = '.navbar-nav > a:nth-of-type(5)';
    var _NAVBAR_PANEL_SELECTOR = '.navbar-nav > a:nth-of-type(6)';

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
                <a class="nav-item nav-link" href="#">基本信息</a>                               \
                <a class="nav-item nav-link" href="#">房屋结构</a>                               \
                <a class="nav-item nav-link" href="#">照片全景</a>                               \
                <a class="nav-item nav-link" href="#">地理位置</a>                               \
                <a class="nav-item nav-link" href="#">周边环境</a>                               \
                <a class="nav-item nav-link" href="#">直播看房</a>                               \
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
            info: new HouseInfo( app ),
            frame: new HouseFrame( app ),
            location: new HouseLocation( app ),
            photo: new HousePhoto( app ),
            feature: new HouseFeature( app ),
            panel: new HousePanel( app ),
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
            scope.dispatchEvent( new ifuture.Event( 'house:opened' ) );
            return;
        }

        this._url = url;
        scope.dispatchEvent( new ifuture.Event( 'house:opened' ) );

    };

    /**
     * 关闭房子
     *
     * @private
     */
    House.prototype.closeHouse_ = function ( url ) {
        this.hide_();
        scope.dispatchEvent( new ifuture.Event( 'house:closed' ) );
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

        element.querySelector( _NAVBAR_INFO_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showInfo_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_FRAME_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showFrame_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_PHOTO_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showPhoto_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_LOCATION_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showLocation_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_FEATURE_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showFeature_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_PANEL_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showPanel_( e.currentTarget.textContent );
        }, false );

        this._element = element;

    };

    /**
     * 显示房屋基本信息
     *
     * @private
     */
    House.prototype.showInfo_ = function ( title ) {

        if ( this._views.current === this._views.info )
            return;
        if ( this._views.current !== null )
            this._views.current.hide();

        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
        this._views.show( this._url );

    };

    /**
     * 显示房屋结构图片
     *
     * @private
     */
    House.prototype.showView_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    /**
     * 显示房屋照片全景
     *
     * @private
     */
    House.prototype.showPhoto_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    /**
     * 显示房屋地理位置
     *
     * @private
     */
    House.prototype.showLocation_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    /**
     * 显示房屋周边环境
     *
     * @private
     */
    House.prototype.showContext_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    /**
     * 显示房屋直播窗口
     *
     * @private
     */
    House.prototype.showPanel_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    return House;

} );
