define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    SearchTool = function ( app, opt_options ) {
        Toolcase.Component.call( this );
    }
    ifuture.inherits( SearchTool, Toolcase );

    SearchTool.prototype.open = function () {
    };

    SearchTool.prototype.close = function () {
    };

    return SearchTool;

} );
