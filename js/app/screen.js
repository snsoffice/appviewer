define( [ 'ifuture', 'config', 'restapi' ], function ( ifuture, config, restapi ) {

    Screen = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

    }
    ifuture.inherits( Screen, ifuture.Component );

    Screen.prototype.bindFutureEvent = function () {
    };

    return Screen;

} );
