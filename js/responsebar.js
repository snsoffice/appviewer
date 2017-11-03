define( [ 'ifuture' ],

function( ifuture ) {

    Responsebar = function ( app, opt_options ) {
        ifuture.Component.call( this );
    }
    ifuture.inherits( Responsebar, ifuture.Component );

    Responsebar.prototype.show = function ( msg, acceptCallback, rejectCallback, ignoreCallback ) {
        var scope = this;
        var element = document.createElement( 'DIV' );
        element.className = 'dx-responsebar';
        element.innerHTML = '<span>' + msg + '</span>' +
            '<div class="pull-right">' +
            '  <a class="btn btn-success" href="#"><i class="fa fa-check"></i></a>' +
            '  <a class="btn btn-danger" href="#"><i class="fa fa-close"></i></a>' +
            '  <a class="btn btn-default" href="#"><i class="fa fa-ellipsis-h"></i></a>' +
            '</div>';            
        document.body.appendChild( element );
        element.addEventListener( 'click', function ( e ) {
            element.remove();
        } );
    };

    return Responsebar;

} );
