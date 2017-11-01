//
// 数据模块接口，应用从这里读取数据
//
// 封装功能
//
//     远程数据同步
//     本地数据查询
//
define( [ 'dexie', 'user', 'state', 'utils' ], function ( Dexie, user, state, utils ) {

    var _db = new Dexie( user.name === null ? 'anonymous' : user.getToken() );

    _db.version( 1 ).stores( {

        settings: '++id, &name, value, description',
        features: 'id, &title, geometry, category, icon, url',

        user_images: '++id, title, description, timestamp, data',
        map_features: 'id, &title, geometry, category, mimetype, icon, url',
        map_layers: 'id, &title, category, source, extent, opacity, minResolution, maxResolution, favorite',

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

    function querySettings() {
        _db.transaction( 'r', _db.settings, function () {
            var settings = state.settings;
            _db.settings.each( function ( item ) {
                settings[item.name] = item.value;
            } );
        } );
    }

    function saveSettings() {
        _db.transaction( 'rw', _db.settings, function () {
            var settings = state.settings;
            _db.settings.modify( function( item ) {
                item.value = settings[ item.name ];
            } );
        } );
    }

    function newSetting( name, value ) {
        _db.settings.add( {
            name: name,
            value: valude,
        } );
    }

    var MapFeature = _db.features.defineClass( {

        id: Number,
        title: String,
        geometry: String,
        category: String,
        icon: String,
        url: String,

    } );

    MapFeature.prototype.save = function () {

        return db.features.put( this );

    }

    function requestRemoteData( item ) {

        var id = item === undefined ? 0 : item.id;
        if ( ! id ) {
            _db.transaction( 'rw', _db.features, function () {
                _db.features.add( {
                    id: 1,
                    title: '华清池御汤酒店',
                    geometry: 'POINT (12156763.90 4077916.87)',
                    category: 'organization',
                    icon: 'hotel',
                    url: 'http://owtayt1td.bkt.clouddn.com/huaqingchi',
                } );
                _db.features.add( {
                    id: 2,
                    title: '西北大学长安校区',
                    geometry: 'POINT (12119354.46 4048989.50)',
                    category: 'organization',
                    icon: 'school',
                    url: 'http://owtayt1td.bkt.clouddn.com/xibeidaxue/changanxiaoqu',
                } );
                _db.features.add( {
                    id: 3,
                    title: '绿地世纪城',
                    geometry: 'POINT (12119428.31 4055374.30)',
                    category: 'organization',
                    icon: 'village',
                    url: 'http://owtayt1td.bkt.clouddn.com/lvdishijicheng',
                } );
                _db.features.add( {
                    id: 4,
                    title: '咸阳国际机场',
                    geometry: 'POINT (12107045.45 4088525.52)',
                    category: 'organization',
                    icon: 'airport',
                    url: 'http://owtayt1td.bkt.clouddn.com/xianyangguojijichang',
                } );
                return 4;

            } ).then( function ( n ) {
                console.log( '更新 ' + n + ' 条数据');
            } );
        }

    }

    //
    // 处理数据同步
    //
    function synchronizeHandler( event ) {

        if ( ! navigator.onLine ) {
            utils.warning( '离线状态无法同步数据' );
            return;
        }

        _db.transaction('rw', _db.features, function () {
            _db.features.clear();
            // 通过 ajax 请求服务器数据
            //     user.name
            //     user.token
            //     maximum id
            _db.features.orderBy( 'id' ).last( requestRemoteData );
        } );

    }

    //
    // 查询本地数据
    //
    function queryFeatures( callback, title ) {

        _db.transaction( 'r', _db.features, function () {
            if ( title === undefined )
                _db.features.toArray().then( callback );
            else
                _db.features.where( 'title' ).startsWith( title ).toArray().then( callback );
        } );

    }

    //
    // 数据同步的触发条件
    //

    // 网络连接从离线到在线
    window.addEventListener( 'online', synchronizeHandler, false );

    // 登录成功之后进行数据同步操作
    document.addEventListener( 'login', synchronizeHandler, false );

    // App 后台切换到前台时候进行数据同步操作
    document.addEventListener( 'resume', synchronizeHandler, false );

    // App 启动进行数据同步操作
    synchronizeHandler();

    //
    // 初始化 state.settings
    //
    querySettings();

    return {

        synchronize: synchronizeHandler,

        query: queryFeatures,

        newSetting: newSetting,

        saveSettings: saveSettings,

    }

});
