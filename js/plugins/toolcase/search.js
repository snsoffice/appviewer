define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    SearchTool = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'search';
        this.title = '搜索';
    }
    ifuture.inherits( SearchTool, Toolcase );

    SearchTool.prototype.create = function () {
        var element = document.createElement( 'DIV' );
        element.textContent = '这是搜索页面';
        return element;
    };

    return SearchTool;

} );
