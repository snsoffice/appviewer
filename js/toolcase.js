define( [ 'ifuture' ],

function( ifuture ) {

    Toolcase = function ( app, opt_options ) {
        ifuture.Component.call( this );

        this.app = app;
        this.name = '';
        this.title = '';
        this.actions = [];
    }
    ifuture.inherits( Toolcase, ifuture.Component );

    Toolcase.prototype.create = function () {
    };

    Toolcase.prototype.destroy = function () {
    };

    return Toolcase;

} );
