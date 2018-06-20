define( [ 'ifuture', 'config', 'restapi', 'logger',
          'app/user', 'app/finder', 'app/house',
          'app/loader', 'app/screen', 'app/connector' ],

function( ifuture, config, restapi, logger,
          User, Finder, House,
          Loader, LivingBox, Connector ) {

    var HOUSE_URL = 'house';
    var HOUSE_ANCHOR = 'anchor';
    var HOUSE_TOKEN = 'token';

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
            case HOUSE_URL:
            case HOUSE_ANCHOR:
            case HOUSE_TOKEN:
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

        this.user = new User( this, opt_options );
        this.finder = new Finder( this, opt_options );
        this.house = new House( this, opt_options );
        this.loader = new Loader( this, opt_options );
        this.screen = new Screen( this, opt_options );
        this.connector = new Connector( this, opt_options );

        this.bindFutureEvent();
        this.user.bindFutureEvent();
        this.finder.bindFutureEvent();
        this.house.bindFutureEvent();
        this.loader.bindFutureEvent();
        this.screen.bindFutureEvent();
        this.connector.bindFutureEvent();
    };
    ifuture.inherits( Application, ifuture.Component );

    /**
     *
     * 同步请求函数，用于一个组件同步调用另外一个组件的方法
     *
     * @api
     */
    Application.prototype.request = function ( name, action, arguments ) {

        if ( typeof name !== 'string' || typeof action !== 'string' || action.substring(0, 1) === '_' )
            return null;

        var component = this.hasOwnProperty( name ) ? this[ name ] : null;

        if ( component && typeof component[ action ] === 'function' ) {
            if ( !! arguments && ! ( arguments instanceof Array ) )
                arguments = [ arguments ];
            return component[ action ].apply( component, arguments );
        }

    };

    /**
     *
     * 启动应用程序
     *
     * @api
     */
    Application.prototype.run = function () {
        if ( config.userId !== null )
            this.dispatchEvent( new ifuture.Event( 'user:login' ) );
        this.connector.start();
        this.finder.startup();
    };

    /**
     *
     * 绑定需要处理的所有事件
     *
     * @api
     */
    Application.prototype.bindFutureEvent = function () {

        // window.addEventListener('unload', this.handleUnload.bind( this ), false);
        // window.addEventListener( 'online', this.handleOnline.bind( this ), false );
        // window.addEventListener( 'offline', this.handleOffline.bind( this ), false );
        this.on( 'finder:ready', this.onStartup_, this );

    };

    /**
     *
     * 应用启动之后根据选项
     *
     * @private
     */
    Application.prototype.onStartup_ = function () {

        document.querySelector( '.dx-splash' ).style.display = 'none';

        var options = configFromURL();
        if ( options[ HOUSE_URL ] ) {
            var argument = { url: options[ HOUSE_URL ] };
            if ( options[ HOUSE_ANCHOR ] ) {
                argument.view = 'panel';
                argument.options = {
                    anchor: options[ HOUSE_ANCHOR ],
                    token: options[ HOUSE_TOKEN ],
                };
            }
            this.dispatchEvent( new ifuture.Event( 'open:house', argument ) );
        }

    };

    return Application;

} );
