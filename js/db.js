//
// 数据模块接口，应用从这里读取数据
//
// 封装功能
//
//     远程数据同步
//     本地数据查询
//
define( [ 'dexie', 'state', 'utils' ], function ( Dexie, state, utils ) {
    
    var _db = new Dexie( state.user.userName === '' ? 'anonymousDB' : state.user.token );

    _db.version( 1 ).stores( {

        settings: "++id, &name, value, description",
        features: "++id, &title, geometry, preview, url",

    } );

    var SettingItem = _db.settings.defineClass( {

        id: Number,
        name: String,
        value: String,
        description: String,

    } );

    SettingItem.prototype.save = function () {

        return db.settings.put( this );

    }

    var MapFeature = _db.features.defineClass( {

        id: Number,
        title: String,
        geometry: String,
        icon: String,
        url: String,

    } );

    MapFeature.prototype.save = function () {

        return db.features.put( this );

    }

    //
    // 处理数据同步
    //    
    function synchronizeHandler( event ) {
        
        if ( ! navigator.onLine ) {
            utils.warning( '离线状态无法同步数据' );
            return;
        }

    }

    // 
    // 查询本地数据
    // 
    function queryFeatures( callback, title ) {

        if ( title === undefined )
            _db.features.toArray().then( callback );
        else
            _db.features.where( 'title' ).startsWith( title ).toArray().then( callback );

    }

    //
    // 数据同步的触发条件
    //

    // 网络连接从离线到在线
    window.addEventListener( 'online', synchronizeHandler, false );

    // 登录成功之后进行数据同步操作
    document.addEventListener( "login", synchronizeHandler, false );

    // App 后台切换到前台时候进行数据同步操作
    document.addEventListener( "resume", synchronizeHandler, false );

    // App 启动进行数据同步操作
    synchronizeHandler();

    return {

        synchronize: synchronizeHandler,

        query: queryFeatures,
    }

});
