define( [ 'ifuture' ],

function( ifuture ) {

    var _ID = 'loader';

    Loader = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        this._element = document.getElementById( _ID );

    }
    ifuture.inherits( Loader, ifuture.Component );

    /**
     *
     * 事件绑定程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @observable
     * @api
     */
    Loader.prototype.bindFutureEvent = function () {

        this.app.on( 'show:loader', this.show, this );
        this.app.on( 'hide:loader', this.hide, this );

    };

    /**
     *
     * 显示装载动画
     *
     * @observable
     * @api
     */
    Loader.prototype.show = function ( msg ) {
        this._element.style.display = 'flex';
        this._element.querySelector( 'SPAN' ).textContent = typeof msg === 'string' ? msg : '';
    }

    /**
     *
     * 隐藏装载动画
     *
     * @observable
     * @api
     */
    Loader.prototype.hide = function () {
        this._element.style.display = 'none';
    }


    return Loader;

} );
