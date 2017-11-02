define( [ 'ifuture' ],

function( ifuture ) {

    Toolcase = function ( app, opt_options ) {
        ifuture.Component.call( this );
    }
    ifuture.inherits( Toolcase, ifuture.Component );

    Toolcase.prototype.getTitle = function () {
        return '';
    };

    Toolcase.prototype.getTActions = function () {
        return [];
    };

    Toolcase.prototype.open = function ( feature ) {
    };

    Toolcase.prototype.close = function () {
    };

    return Toolcase;

} );
