define( [ 'ifuture' ],

function( ifuture ) {

    var _ID = 'loader';

    Loader = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        var element = document.getElementById( _ID );
        this._element = element;

    }
    ifuture.inherits( Loader, ifuture.Component );

    /**
     *
     * 事件处理程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Loader.prototype.handleFutureEvent = function ( event ) {
        
        if ( event.type === 'loader:show' ) {
            this.show( event.argument );
        }

        else if ( event.type === 'loader:hide' ) {
            this.hide();
        }

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
        this._element.querySelector( 'SPAN' ).textContent = msg === undefined ? '' : msg;
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
