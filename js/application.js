//
// 应用程序的状态:
//
//     当前登录用户，
//     当前正在访问的空间，个人空间、公众空间和我的空间（仅登录用户）
//
// 应用程序启动参数:
//
//     直接打开房间 house=/path/to/room
//     直接进入直播 living=/path/to/room or TOKEN
//     个人空间     domain=USERID
//     公众空间     没有 domain 或者 domain 为空
//
define( [ 'ifuture', 'utils', 'config', 'db', 'user', 'map', 'minimap',
          'explorer', 'manager', 'vision', 'navbar', 'modebar',
          'footbar', 'responsebar', 'dialog', 'loader', 'communicator' ],

function( ifuture, utils, config, db, User, Map, Minimap,
          Explorer, Manager, Vision, Navbar, Modebar,
          Footbar, Responsebar, Dialog, Loader, Communicator ) {

    var HOUSE_DOMAIN = 'domain';
    var HOUSE_NAME = 'house';
    var LIVING_TOKEN = 'living';

    var configFromURL = function () {

        var url;
        if (window.location.hash.length > 0) {
            // Prefered method since parameters aren't sent to server
            url = [window.location.hash.slice(1)];
        } else {
            url = decodeURI(window.location.href).split('?');
            url.shift();
        }
        if (url.length < 1) {
            return {};
        }
        url = url[0].split('&');

        var options = {};
        for (var i = 0; i < url.length; i++) {
            var name = url[i].split('=')[0];
            var value = url[i].split('=')[1];
            switch(name) {
                // configFromURL[ name ] = decodeURIComponent(value);
                // configFromURL[ name ] = Number(value);
                // configFromURL[ name ] = JSON.parse(value);
            case HOUSE_DOMAIN: case HOUSE_NAME: case LIVING_TOKEN:
                options[ name ] = decodeURIComponent(value);
                break;
            default:
                console.log('An invalid configuration parameter was specified: ' + name);
                break;
            }
        }
        return options;

    };


    Application = function ( opt_options ) {
        ifuture.Component.call( this );

        this._startupOptions = configFromURL();
        if ( this._startupOptions.hasOwnProperty( HOUSE_DOMAIN ) ) {
            config.houseDomain = this._startupOptions[ HOUSE_DOMAIN ];
        }

        this.user = new User( this, opt_options );

        this.navbar = new Navbar( this, opt_options );
        this.map = new Map( this, opt_options );
        this.minimap = new Minimap( this, opt_options );
        this.modebar = new Modebar( this, opt_options );
        this.footbar = new Footbar( this, opt_options );

        this.vision = new Vision( this, opt_options );
        this.explorer = new Explorer( this, opt_options );
        this.manager = new Manager( this, opt_options );

        this.dialog = new Dialog( this, opt_options );
        this.communicator = new Communicator( this, opt_options );
        this.responsebar = new Responsebar( this, opt_options );

        this.loader = new Loader( this, opt_options );

        // 所有对象之间的事件绑定关系
        this.on( [ 'helper:changed', 'select:village', 'select:house', 'living:opened' ], this.map.handleFutureEvent, this.map );
        this.on( [ 'carousel:changed' ], this.explorer.handleFutureEvent, this.explorer );
        this.on( [ 'user:login', 'user:logout', 'living:start', 'living:end' ], this.navbar.handleFutureEvent, this.navbar );
        this.on( [ 'task:close' ], this.manager.handleFutureEvent, this.manager );
        this.on( [ 'peerMessage', 'userNameChanged' ], this.communicator.handleFutureEvent, this.communicator );

        this.map.on( [ 'site:changed', 'view:opened' ], this.minimap.handleFutureEvent, this.minimap );
        this.map.on( [ 'elevation:changed' ], this.modebar.handleFutureEvent, this.modebar );

        this.minimap.on( [ 'view:remove' ], this.map.handleFutureEvent, this.map );

    };
    ifuture.inherits( Application, ifuture.Component );

    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( name ) ? this[ name ] :
            this.manager.hasPlugin( name ) ? this.manager.getPlugin( name ) :
            this.explorer.hasPlugin( name ) ? this.explorer.getPlugin( name ) :
            null ;

        if ( component && typeof component[ action ] === 'function' ) {
            if ( !! arguments && ! ( arguments instanceof Array ) )
                arguments = [ arguments ];
            return component[ action ].apply( component, arguments );
        }

    };

    // 参考安卓的进程状态
    Application.prototype.hiberate = function () {
        // this.map.hiberate();
        this.communicator.stop();
    };


    Application.prototype.revive = function () {
        this.communicator.start();
        // this.map.revive();
    };

    Application.prototype.run = function () {
        //
        // 全局事件处理
        //
        var scope = this;
        if ( navigator.onLine ) {
            db.synchornize().then( function () {
                scope.map.revive();
            } ).catch( function ( e ) {
                console.log( '同步数据失败: ' + e );
            } );
        }
        else {
            console.log( '离线状态无法同步数据' );
            this.map.revive();
        }


        

        //
        // 退出页面的时候保存状态
        //
        window.addEventListener('unload', this.hibernate, false);

        //
        // 网络断开和连接事件
        //
        window.addEventListener( 'online', this._handleOnline.bind( this ), false );
        window.addEventListener( 'offline', this._handleOffline.bind( this ), false );

        //
        // 恢复上次退出时候的状态
        //
        this.revive();
    };

    Application.prototype.isOnline = function () {
        return navigator.onLine;
    };

    Application.prototype._handleOnline = function ( e ) {
        this.communicator.restart();
    };

    Application.prototype._handleOffline = function ( e ) {
        this.communicator.stop();
    };

    //
    // 当应用程序启动完成之后的行为，
    //
    //     * 第一次打开时候触发
    //     * 在安卓上从后台切换到前台触发
    //
    Application.prototype.onStartup = function () {

        // 如果是第一次启动，那么读取 url 里面传入的参数
        //     usrscope
        //     house
        //     living

        // 如果是在安卓上从后台切换到前台，那么读取配置信息

        // 打开指定的房子
        if ( this._startupOptions[ 'house' ] ) {
        }

        // 观看直播
        if ( this._startupOptions[ 'living' ] ) {
        }

    };

    Application.prototype.login = function () {
        this.dialog.login( this.user.login.bind( this.user ) );
    }

    Application.prototype.logout = function () {
        this.user.logout();
    }

    Application.prototype.signup = function () {
        this.dialog.signup( this.user.signup.bind( this.user ) );
    }

    return Application;

} );
