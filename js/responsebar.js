define( [ 'ifuture' ],

function( ifuture ) {

    Responsebar = function ( app, opt_options ) {
        ifuture.Component.call( this );
    }
    ifuture.inherits( Responsebar, ifuture.Component );

    Responsebar.prototype.show = function ( msg, acceptCallback, rejectCallback, ignoreCallback ) {

        var element = document.getElementById( 'responsebar' );
        if ( element )
            document.body.removeChild( element );

        var buttons = [];
        if ( typeof acceptCallback === 'function' )
            buttons.push( '<button name="accept" class="btn btn-xs btn-success"><i class="fas fa-check"></i></button>' );
        if ( typeof rejectCallback === 'function' )
            buttons.push( '<button name="reject" class="btn btn-xs btn-success"><i class="fas fa-times"></i></button>' );
        if ( typeof ignoreCallback === 'function' )
            buttons.push( '<button name="ignore" class="btn btn-xs btn-success"><i class="fas fa-ellipsis-h"></i></button>' );

        var element = document.createElement( 'DIV' );
        element.id = 'responsebar';
        element.className = 'dx-responsebar';
        element.innerHTML = '<span>' + msg + '</span>' + '<div class="pull-right">' + buttons.join( '' ) + '</div>';
        document.body.appendChild( element );

        var button = element.querySelector( 'button[name="accept"]' );
        if ( button )
            button.addEventListener( 'click', function ( e ) { acceptCallback(); } );
        button = element.querySelector( 'button[name="reject"]' );
        if ( button )
            button.addEventListener( 'click', function ( e ) { rejectCallback(); } );
        button = element.querySelector( 'button[name="ignore"]' );
        if ( button )
            button.addEventListener( 'click', function ( e ) { ignoreCallback(); } );
        element.addEventListener( 'click', function ( e ) {
            element.remove();
        } );

    };

    return Responsebar;

} );
