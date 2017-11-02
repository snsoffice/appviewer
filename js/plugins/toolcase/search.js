define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    SearchTool = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'search';
        this.title = '搜索';
        this.element = null;
    }
    ifuture.inherits( SearchTool, Toolcase );

    SearchTool.prototype.create = function () {
        if ( this.element === null ) {
            this.element = document.createElement( 'DIV' );
            this.element.textContent = '这是搜索页面';
        }
        return this.element;
    };

    SearchTool.prototype.destroy = function () {
    };

    return SearchTool;

} );
