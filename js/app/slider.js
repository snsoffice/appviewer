define( [ 'ifuture' ], function( ifuture ) {

    var _SLIDE_THRESOLD = Math.min( 80, Math.min( window.innerWidth, window.innerHeight ) / 4 );
    var _SLIDE_EVENT_NAME = 'slide:view';

    Slider = function ( target ) {

        ifuture.Component.call( this );

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._target = target;

        /**
         *
         * @private
         * @type {boolean}
         */
        this._enabled = true;

        /**
         *
         * @private
         * @type {TouchList}
         */
        this._lastTouches = null;

        target.addEventListener( 'touchstart', this.onTouchStart_.bind( this ), false );
        target.addEventListener( 'touchend', this.onTouchEnd_.bind( this ), false );

    }
    ifuture.inherits( Slider, ifuture.Component );

    /**
     *
     * 触摸开始事件
     *
     * @observable
     * @api
     */
    Slider.prototype.onTouchStart_ = function ( e ) {

        this._lastTouches = e.touches;
        return true;            // 否则会破坏事件

    };

    /**
     *
     * 触摸结束事件
     *
     * @observable
     * @api
     */
    Slider.prototype.onTouchEnd_ = function ( e ) {

        if ( this._lastTouches === null )
            return true;

        var touches = e.changedTouches;
        if ( this._lastTouches.length >= touches.length ) {

            var n = touches.length;
            var direction = 0;
            var result = true;

            for ( var i = 0; i < n; i ++ ) {
                direction = touches[ i ].pageX - this._lastTouches[ i ].pageX;
                if ( Math.abs( direction ) < _SLIDE_THRESOLD ) {
                    result = false;
                    break;
                }
            }

            if ( result )
                this.dispatchEvent( new ifuture.Event( _SLIDE_EVENT_NAME, {
                    direction: direction,
                    fingers: this._lastTouches.length,
                } ) );

        }

        this._lastTouches = null;
        return true;

    };

    return Slider;

} );
