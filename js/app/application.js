define( [ 'ifuture', 'config', 'restapi', 'logger', 'utils',
          'app/user', 'app/finder', 'app/house',
          'app/loader', 'app/screen', 'app/communicator' ],

function( ifuture, config, restapi, logger, utils,
          User, Finder, House,
          Loader, LivingBox, Communicator ) {

    var HOUSE_URL = utils.PARA_HOUSE_URL;
    var HOUSE_LIVING = utils.PARA_HOUSE_LIVING;
    var configFromURL = utils.configFromURL;

    Application = function ( opt_options ) {
        ifuture.Component.call( this );

        this.user = new User( this, opt_options );
        this.finder = new Finder( this, opt_options );
        this.house = new House( this, opt_options );
        this.loader = new Loader( this, opt_options );
        this.screen = new Screen( this, opt_options );
        this.communicator = new Communicator( this, opt_options );

        this.bindFutureEvent();
        this.user.bindFutureEvent();
        this.finder.bindFutureEvent();
        this.house.bindFutureEvent();
        this.loader.bindFutureEvent();
        this.screen.bindFutureEvent();
        this.communicator.bindFutureEvent();
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
            this.dispatchEvent( new ifuture.Event( 'open:house', options[ HOUSE_URL ] ) );
            if ( options[ HOUSE_LIVING ] ) {
                this.dispatchEvent( new ifuture.Event( 'view:panel', options[ HOUSE_LIVING ] ) );
            }
        }

    };

    return Application;

} );
