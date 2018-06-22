define( [ 'ifuture', 'config', 'restapi' ], function ( ifuture, config, restapi ) {

    var _TEMPLATE = '                                           \
        <div class="dx-tab bg-secondary ">                      \
          <div class="card">                                    \
            <div class="card-header">%LOCATION%</div>           \
            <div class="card-body">                             \
              <dl>                                              \
                <dt>房号</dt><dd>%TITLE%</dd>                   \
                <dt>楼层</dt><dd>%FLOOR%</dd>                   \
                <dt>户型</dt><dd>%TYPE%</dd>                    \
                <dt>面积</dt><dd>%AREA%</dd>                    \
                <dt>描述</dt><dd>%DESCRIPTION%</dd>             \
              </dl>                                             \
            </div>                                              \
          </div>                                                \
        </div>';

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '基本信息';

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

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开房子基本信息窗口
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

        this.buildView_();
        this._url = url;

        this._element.style.display = 'block';

    };

    /**
     * 关闭房屋基本信息窗口
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

    }

    /**
     * 隐藏房屋基本信息窗口
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
        var data = this._data;
        var metadata = data.metadata;

        element.innerHTML = _TEMPLATE
            .replace( '%LOCATION%', metadata.house_location)
            .replace( '%TITLE%', data.title)
            .replace( '%DESCRIPTION%', data.description)
            .replace( '%FLOOR%', metadata.floor)
            .replace( '%TYPE%', metadata.house_type)
            .replace( '%AREA%', metadata.house_area);

        element = element.firstElementChild;
        document.querySelector( this._target ).appendChild( element );
        this._element = element;

    };

    return View;

} );
