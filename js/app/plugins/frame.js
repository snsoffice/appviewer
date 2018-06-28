define( [ 'ifuture', 'config', 'app/slider' ], function ( ifuture, config, Slider ) {

    var _TEMPLATE = '                     \
      <div class="dx-tab bg-secondary ">  \
         %FRAMES%                         \
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

    var _THREE_TEMPLATE = '                                                           \
        <div class="dx-frame w-100 h-100" style="display:none;">                      \
          <div class="d-flex w-100 h-100 justify-content-center align-items-center">  \
            <div data-src="%SRC%" class="text-white">点击打开三维模型</div>           \
          </div>                                                                      \
        </div>';

    var _INDICATOR_SELECTOR = 'ol.carousel-indicators > li';
    var _CURRENT_INDICATOR_SELECTOR = 'ol.carousel-indicators > li.active';
    var _FRAME_SELECTOR = 'div.dx-frame';

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '房屋结构';

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
         * 在手机左右滑动切换不同房屋结构的控件
         * @private
         * @type {ifuture.Slider}
         */
        this._slider = null;

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开房屋结构窗口
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
     * 关闭房屋结构窗口
     *
     * @public
     */
    View.prototype.close = function () {

        if ( this._element !== null ) {
            this._element.remove();
            this._element = null;
        }
        this._slider = null;
        this._url = null;
        this._data = null;

    }

    /**
     * 隐藏房屋结构窗口
     *
     * @public
     */
    View.prototype.hide = function () {

        this._element.style.display = 'none';

    }

    /**
     * 左右滑动切换视图事件，事件参数包括两个属性
     *
     *     direction > 0 向右滑动，< 0 向左滑动
     *     fingers   触动时候的手指数目
     *
     * @param {ifutre.Event} event
     * @private
     */
    View.prototype.onSlideEvent_ = function ( event ) {
        
        var direction = event.argument.direction;
        var fingers = event.argument.fingers;

        if ( fingers === 1 ) {
            var indicator = this._element.querySelector( _CURRENT_INDICATOR_SELECTOR );
            if ( indicator ) {
                var index = parseInt( indicator.getAttribute( 'data-slide-to' ) );
                if ( direction > 0 && index > 0 ) {
                    this.select_( index - 1 );
                    return true;
                }
                else if ( direction < 0 && index < this._data.frames.length - 1 ) {
                    this.select_( index + 1 );
                    return true;
                }
            }
        }

    };

    /**
     * 创建页面对象
     *
     * @private
     */
    View.prototype.buildView_ = function () {

        var element = document.createElement( 'DIV' );
        var frames = this._data.frames;

        var indicators = [];
        var results = [];
        for ( var i = 0; i < frames.length; i ++ ) {
            indicators.push( _INDICATOR_TEMPLATE.replace( '%INDEX%', i.toString() ) );
            if ( frames[ i ].type === 'three' )
                results.push( _THREE_TEMPLATE.replace( '%SRC%', frames[ i ].url ).replace( '%TITLE%', frames[ i ].title ) );
            else
                results.push( _FRAME_TEMPLATE.replace( '%SRC%', frames[ i ].url ).replace( '%TITLE%', frames[ i ].title ) );
        }

        element.innerHTML = _TEMPLATE
            .replace( '%FRAMES%', results.join( '' ) )
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

        this._slider = new Slider( element );
        this._slider.on( Slider.SLIDE_EVENT_NAME, this.onSlideEvent_, this );

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
