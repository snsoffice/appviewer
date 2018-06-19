define( [ 'ifuture', 'config' ], function ( ifuture, config ) {

    View = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '房屋位置';

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

    }
    ifuture.inherits( View, ifuture.Component );

    View.prototype.open = function ( url ) {

        if ( this._url === url )
            return;

    };

    View.prototype.close = function () {

        if ( this._element !== null )
            this._element.style.display = 'none';

    }

    return View;

} );
