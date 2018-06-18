define( [ 'ifuture', 'config', 'restapi' ], function ( ifuture, config, restapi ) {

    var _SELECTOR = '.dx-viewer';

    var _NAVBAR_BRAND_SELECTOR = '.navbar-brand';
    var _NAVBAR_TITLE_SELECTOR = 'nav.navbar > span.navbar-text';
    var _NAVBAR_MENU_SELECTOR = '.navbar-collapse.collapse';
    var _NAVBAR_BASIC_SELECTOR = '.navbar-nav > a:nth-of-type(1)';
    var _NAVBAR_VIEW_SELECTOR = '.navbar-nav > a:nth-of-type(2)';
    var _NAVBAR_PHOTO_SELECTOR = '.navbar-nav > a:nth-of-type(3)';
    var _NAVBAR_LOCATION_SELECTOR = '.navbar-nav > a:nth-of-type(4)';
    var _NAVBAR_CONTEXT_SELECTOR = '.navbar-nav > a:nth-of-type(5)';
    var _NAVBAR_LIVING_SELECTOR = '.navbar-nav > a:nth-of-type(6)';

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
              <div class="navbar-nav ml-auto text-center">                                                   \
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
            this.hide_();
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

        element.querySelector( _NAVBAR_BASIC_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showBasic_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_VIEW_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showView_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_PHOTO_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showPhoto_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_LOCATION_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showLocation_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_CONTEXT_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showContext_( e.currentTarget.textContent );
        }, false );

        element.querySelector( _NAVBAR_LIVING_SELECTOR ).addEventListener( 'click', function ( e ) {
            scope.showLiving_( e.currentTarget.textContent );
        }, false );

        this._element = element;

    };

    /**
     * 显示房屋基本信息
     *
     * @private
     */
    House.prototype.showBasic_ = function ( title ) {
        this._element.querySelector( _NAVBAR_TITLE_SELECTOR ).textContent = title;
    };

    return House;

} );
