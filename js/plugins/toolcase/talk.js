define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    Talk = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'talk';
        this.title = '会话';
    }
    ifuture.inherits( Talk, Toolcase );

    Talk.prototype.create = function () {
        var element = document.createElement( 'DIV' );
        element.textContent = '这是会话页面';
        return element;
    };

    return Talk;

} );

