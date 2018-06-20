define( [ 'ifuture', 'config' ], function ( ifuture, config ) {

    var _TEMPLATE = '                     \
      <div class="dx-tab bg-secondary ">  \
         %VIEWS%                          \
         <ol class="carousel-indicators"> \
           %INDICATORS%                   \
         </ol>                            \
      </div>';

    var _INDICATOR_TEMPLATE = '<li data-slide-to="%INDEX%"></li>';

    var _FRAME_TEMPLATE = '                                                          \
        <div class="dx-frame w-100 h-100" style="display:none;">                     \
          <div class="d-flex w-100 h-100 justify-content-center align-items-center"> \
            <img src="%SRC%" class="img-fluid mh-100 mw-100 p-1" alt="%TITLE%">      \
          </div>                                                                     \
        </div>';

    var _INDICATOR_SELECTOR = 'ol.carousel-indicators > li';
    var _FRAME_SELECTOR = 'div.dx-frame';

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
        this.select_( 0 );

    };

    /**
     * 关闭房屋基本信息窗口
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
        var views = this._data.views;

        var indicators = [];
        var results = [];
        for ( var i = 0; i < views.length; i ++ ) {
            indicators.push( _INDICATOR_TEMPLATE.replace( '%INDEX%', i.toString() ) );
            results.push( _FRAME_TEMPLATE.replace( '%SRC%', views[ i ].url ).replace( '%TITLE%', views[ i ].name ) );
        }

        element.innerHTML = _TEMPLATE
            .replace( '%VIEWS%', results.join( '' ) )
            .replace( '%INDICATORS%', indicators.join( '' ) );

        element = element.firstElementChild;
        document.querySelector( this._target ).appendChild( element );
        this._element = element;

        var scope = this;
        Array.prototype.forEach.call( element.querySelectorAll( _INDICATOR_SELECTOR ), function ( li ) {
            li.addEventListener( 'click', function ( e ) {
                scope.select_( parseInt( e.currentTarget.getAttribute( 'data-slide-to' ) ) );
            }, false );
        } );

    };


    /**
     * 选择不同的房屋结构
     *
     * @private
     */
    View.prototype.select_ = function ( index ) {
        
        Array.prototype.forEach.call( this._element.querySelectorAll( _INDICATOR_SELECTOR ), function ( li ) {
            li.className = '';
        } );

        Array.prototype.forEach.call( this._element.querySelectorAll( _FRAME_SELECTOR ), function ( frame ) {
            frame.style.display = 'none';
        } );

        index ++;

        var li = this._element.querySelector( _INDICATOR_SELECTOR + ':nth-of-type(' + index + ')' );
        if ( li ) {
            li.className = 'active';
            var frame = this._element.querySelector( _FRAME_SELECTOR + ':nth-of-type(' + index + ')' );
            if ( frame )
                frame.style.display = 'block';
        }

    };

    return View;

} );
