define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    Maplayer = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'maplayer';
        this.title = '图层';
    }
    ifuture.inherits( Maplayer, Toolcase );

    Maplayer.prototype.create = function () {
        var element = document.createElement( 'DIV' );
        element.textContent = '图层页面';
        return element;
    };

    return Maplayer;

} );
