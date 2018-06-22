define( [ 'ifuture' ], function( ifuture ) {

    var _SLIDE_THRESOLD = Math.min( 80, Math.min( window.innerWidth, window.innerHeight ) / 4 );

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
        this._touches = null;

        target.addEventListener( 'touchstart', this.onTouchStart_, this );
        target.addEventListener( 'touchend', this.onTouchEnd_, this );

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

        this._touches = e._touches;
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

        var touches = e.touches;

        if ( this._touches.length === touches.length ) {

            var n = touches.length;
            var direction = 0;
            var result = true;

            for ( var i = 0; i < n; i ++ ) {
                direction = touches[ i ].pageX - this._touches[ i ].pageX;
                if ( Math.abs( direction ) < _SLIDE_THRESOLD ) {
                    result = false;
                    break;
                }
            }

            if ( result )
                this.dispatchEvent( new ifuture.Event( 'slide:view', {
                    direction: direction,
                    touches: n,
                } ) );

        }

        return true;

    };

    return Slider;

} );
