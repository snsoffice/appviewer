define( [ 'ifuture', 'config', 'restapi' ], function ( ifuture, config, restapi ) {

    HouseInfo = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

    }
    ifuture.inherits( HouseInfo, ifuture.Component );

    HouseInfo.prototype.bindFutureEvent = function () {

        this.app.on( 'login', function () {
            dialog.login( this.login.bind( this ) );
        }, this );

        this.app.on( 'logout', this.logout, this );

        this.app.on( 'signup', function () {
            dialog.signup( this.signup.bind( this ) );
        }, this );

    };


    return HouseInfo;

} );
