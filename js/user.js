define( [ 'ifuture', 'config', 'restapi' ], function ( ifuture, config, restapi ) {

    User = function ( app, opt_options ) {
        ifuture.Component.call( this, app );
    }
    ifuture.inherits( User, ifuture.Component );

    User.prototype.login = function ( username, password ) {

        restapi.login( username, password ).then( function ( token ) {
            config.userId = username;
            config.loginToken = token;
        } ).catch( function ( e ) {
            config.userId = null;
            config.loginToken = null;
        } );

    };

    User.prototype.logout = function () {
    };

    User.prototype.signup = function () {
    };

    return User;

} );
