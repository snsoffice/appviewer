define( [ 'ifuture', 'config', 'restapi', 'utils', 'app/dialog' ], function ( ifuture, config, restapi, utils, dialog ) {

    User = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

    }
    ifuture.inherits( User, ifuture.Component );

    User.prototype.bindFutureEvent = function () {

        this.app.on( 'login', function () {
            dialog.login( this.login.bind( this ) );
        }, this );

        this.app.on( 'logout', this.logout, this );

        this.app.on( 'signup', function () {
            dialog.signup( this.signup.bind( this ) );
        }, this );

    };

    User.prototype.login = function ( username, password ) {

        var app = this.app;
        restapi.login( username, password ).then( function ( token ) {
            config.userId = username;
            config.loginToken = token;
            app.dispatchEvent( new ifuture.Event( 'user:login' ) );
        } ).catch( function ( e ) {
            utils.warning( '用户登录失败!' );
        } );

    };

    User.prototype.logout = function () {

        var scope = this;
        restapi.logout( config.loginToken ).then( function ( token ) {
            config.userId = null;
            config.userName = null;
            config.loginToken = null;
            scope.dispatchEvent( new ifuture.Event( 'user:logout' ) );
        } ).catch( function ( e ) {
            utils.warning( '用户注销失败!' );
        } );

    };

    User.prototype.signup = function ( userid, email, fullname, password ) {

        restapi.registerUser( username, email, fullname, password ).then( function ( result ) {
            utils.info( '用户注册成功，现在可以使用新用户 ' + username + ' 登录系统' );
        } ).catch( function ( e ) {
            utils.warning( '注册用户失败!' );
        } );

    };

    return User;

} );
