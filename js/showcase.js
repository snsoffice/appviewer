define( [ 'ifuture' ],

function( ifuture ) {

    var Showcase = function ( app, opt_options ) {
        ifuture.Component.call( this );

        this.app = app;

        this.name = '';
        this.title = '';
        this.actions = [];
        this.mimetypes = [];
    }
    ifuture.inherits( Showcase, ifuture.Component );

    Showcase.prototype.open = function ( container, item ) {
    };

    Showcase.prototype.snap = function () {
        var img = document.createElement( 'IMG' );
        return img;
    };

    Showcase.prototype.close = function () {
    };

    return Showcase;

} );
