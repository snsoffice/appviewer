define( [ 'ifuture', 'config', 'restapi', 'logger', 'app/dialog' ], function ( ifuture, config, restapi, logger, dialog ) {

    var _TEMPLATE = '                                                                 \
        <div data-view="panel" class="dx-tab bg-light ">                              \
          <div class="border-bottom p-2 text-center">                                 \
            <button type="button" class="btn btn-default my-3">观看直播</button>      \
          </div>                                                                      \
          <div class="border-bottom p-2 text-center">                                 \
            <button type="button" class="btn btn-success my-3">开始直播</button>      \
          </div>                                                                      \
          <form class="p-2 mt-2">                                                     \
            <div class="form-group">                                                  \
              <label for="panel-living-url">直播地址</label>                          \
              <input type="text" class="form-control" id="panel-living-url" readonly> \
            </div>                                                                    \
            <div class="form-group">                                                  \
              <label for="panel-user-name">搜索朋友</label>                           \
              <input type="text" class="form-control" id="panel-user-name">           \
            </div>                                                                    \
            <button type="button" class="btn btn-default">复制直播地址</button>       \
            <button type="button" class="btn btn-default">邀请朋友观看</button>       \
          </form>                                                                     \
        </div>';

    var _WATCH_BUTTON_SELECTOR = 'div.border-bottom:nth-of-type(1) > button';
    var _START_BUTTON_SELECTOR = 'div.border-bottom:nth-of-type(2) > button';
    var _COPY_BUTTON_SELECTOR = 'form button:nth-of-type(1)';
    var _CALL_BUTTON_SELECTOR = 'form button:nth-of-type(2)';
    var _URL_INPUT_SELECTOR = 'form input:nth-of-type(1)';

    var HOUSE_URL = 'house';
    var HOUSE_ANCHOR = 'anchor';
    var HOUSE_TOKEN = 'token';

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '直播看房';

        /**
         * 远程主播信息，包括 anchor 和 token 两个属性
         * @private
         * @type {Object}
         */
        this._callee = null;

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
         * 直播需要的数据，主要是房屋的视图
         * @private
         * @type {Object}
         */
        this._data = null;

        /**
         * 直播房间名称
         * @private
         * @type {String}
         */
        this._room = null;

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开直播控制面板
     *
     * @public
     */
    View.prototype.open = function ( url, data, options ) {

        if ( this._element === null )
            this.buildView_();

        this._element.style.display = 'block';
        this._element.querySelector( _URL_INPUT_SELECTOR ).value = this.buildUrl_( url );

        this._room = ( config.userId + '.' + url.split( '/' ).slice( -1 ) ).slice( 0, 32 );
        this._callee = options && options.anchor && options.token ? options : null;
        this._data = data;
        this._url = url;

    };

    /**
     * 关闭直播控制面板
     *
     * @public
     */
    View.prototype.close = function () {

        this._url = null;
        this._data = null;
        this._callee = null;
        this._room = null;

    }

    /**
     * 隐藏直播控制面板
     *
     * @public
     */
    View.prototype.hide = function () {

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

        var scope = this;
        element.querySelector( _WATCH_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.watchLiving_();
        }, false );
        element.querySelector( _START_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.startLiving_();
        }, false );
        element.querySelector( _COPY_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.copyUrl_();
        }, false );
        element.querySelector( _CALL_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.inviteFriend_();
        }, false );

        this._element = element;

    };

    /**
     * 观看直播
     *
     * @private
     */
    View.prototype.watchLiving_ = function () {

        if ( this._callee === null ) {
            dialog.info( '无法观看直播，当前房屋没有直播信号' );
            return ;
        }

        if ( this._data === null || ! this._data.frames ) {
            dialog.info( '无法观看直播，没有当前房屋的数据' );
            return ;
        }

        var argument = {
            url: this._url,
            frames: this._data.frames,
            locations: this._data.locations,
            callee: this._callee,
        };

        this.dispatchEvent( new ifuture.Event( 'open:screen', argument ) );

    };

    /**
     * 开始直播
     *
     * @private
     */
    View.prototype.startLiving_ = function () {

        if ( config.userId === null ) {
            dialog.info( '只有登录之后才可以进行直播' );
            return ;
        }

        if ( this._data === null || ! this._data.frames ) {
            dialog.info( '无法直播，没有当前房屋的数据' );
            return ;
        }

        var argument = {
            url: this._url,
            frames: this._data.frames,
            locations: this._data.locations,
        };

        this.dispatchEvent( new ifuture.Event( 'open:screen', argument ) );

    };

    /**
     * 生成直播地址
     *
     * @private
     */
    View.prototype.buildUrl_ = function ( url ) {

        var base = config.portalBaseUrl + '/' + config.portalSiteName + '/' + config.appBaseUrl;
        var paras =  [ HOUSE_URL + '=' + encodeURIComponent( url ),
                       HOUSE_ANCHOR + '=' + config.userId,
                       HOUSE_TOKEN + '=' + config.settings.easyrtcId ];
        return base + '?' + paras.join( '&' );

    };

    /**
     * 拷贝直播地址
     *
     * @private
     */
    View.prototype.copyUrl_ = function () {

        var data = this.buildUrl_( this._url );
        var handler = function ( e ) {
            e.clipboardData.setData( 'text/plain', data );
            e.preventDefault();
        };

        var options = { once: true };
        document.addEventListener( 'copy', handler, options );
        if ( ! document.execCommand( 'copy' ) ) {
            document.removeEventListener( 'copy', handler, options );
        }

    };

    /**
     * 邀请朋友观看直播
     *
     * @private
     */
    View.prototype.inviteFriend_ = function () {

        if ( config.userId === null ) {
            dialog.info( '只有登录之后才可以邀请朋友' );
            return ;
        }

    };

    return View;

} );
