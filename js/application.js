// 
// 应用程序的状态:
//
//     当前组织机构/当前建筑物/当前楼层/当前房间
//     当前图层视野
//
//     当前游客是否可见，当前游客位置，当前游客视角
//     当前摄像机是否可见，当前摄像机位置，当前摄像机视角
//
//     正在直播、正在回放、正在浏览
//     
// 应用程序启动参数:
//
//     直接打开房间，隐含打开相关的组织机构/建筑物/楼层
//     直接进入直播
//     直接加入直播
//
define( [ 'ifuture', 'map', 'minimap', 'explorer', 'manager', 'vision',
          'navbar', 'modebar', 'footbar', 'responsebar', 'dialog', 'communicator' ],

function( ifuture, Map, Minimap, Explorer, Manager, Vision,
          Navbar, Modebar, Footbar, Responsebar, Dialog, Communicator ) {

    Application = function ( opt_options ) {
        ifuture.Component.call( this );

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

        // 所有对象之间的事件绑定关系
        this.map.on( [ 'node:open', 'cluster:open' ], this.minimap.handleMapEvent, this.minimap );
        this.map.on( 'elevation:changed', this.modebar.handleElevationEvent, this.modebar );
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

    Application.prototype.hiberate = function () {
        this.map.hiberate();
    };


    Application.prototype.revive = function () {
        this.map.revive();
    };

    Application.prototype.run = function () {
        //
        // 恢复上次退出时候的状态
        //
        this.revive();

        //
        // 启动后台服务对象
        //
        this.communicator.start();

        //
        // 全局事件处理
        //

        //
        // 退出页面的时候保存状态
        //
        window.addEventListener('unload', this.hibernate, false);

        //
        // 网络断开和连接事件
        //
        window.addEventListener( 'online', this._handleOnline.bind( this ), false );
        window.addEventListener( 'offline', this._handleOffline.bind( this ), false );
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

    return Application;

} );
