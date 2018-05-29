//
// 数据模块接口，应用从这里读取数据
//
// 封装功能
//
//     远程数据同步
//     本地数据查询
//
define( [ 'dexie', 'restapi', 'user', 'state', 'utils' ], function ( Dexie, restapi, user, state, utils ) {

    var _db = new Dexie( user.name === null ? 'anonymous' : user.getToken() );

    _db.version( 1 ).stores( {

        settings: '++id, &name, value, description',
        organizations: '++id, title, type, geolocation, url, description',

        features: 'id, &title, geometry, category, icon, url',
        favorites: '++id, type, title, url, parameters, description',

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

    var MapOrganization = _db.organizations.defineClass( {

        id: Number,
        title: String,
        type: String,
        geolocation: String,
        url: String,
        description: String,

    } );

    MapOrganization.prototype.save = function () {

        return db.organizations.put( this );

    }

    function requestRemoteFeatures( item ) {

        var id = item === undefined ? 0 : item.id;
        if ( ! id ) {
            _db.transaction( 'rw', _db.features, function () {
                _db.features.add( {
                    id: 1,
                    title: '绿地世纪城',
                    geometry: 'POINT (12119428.31 4055374.30)',
                    category: 'organization',
                    url: 'organizations/greenland',
                } )
                _db.features.add( {
                    id: 2,
                    title: '西北大学长安校区',
                    geometry: 'POINT (12119354.46 4048989.50)',
                    category: 'organization',
                    url: 'organizations/northwestuniversity',
                } );
                _db.features.add( {
                    id: 3,
                    title: '华清池御汤酒店',
                    geometry: 'POINT (12156763.90 4077916.87)',
                    category: 'organization',
                    url: 'organizations/huaqingchi',
                } );
                _db.features.add( {
                    id: 4,
                    title: '咸阳国际机场',
                    geometry: 'POINT (12107045.45 4088525.52)',
                    category: 'organization',
                    url: 'organizations/xianyangairport',
                } );
                return 4;

            } ).then( function ( n ) {
                console.log( '更新 ' + n + ' 条数据');
            } );
        }
    }

    function requestRemoteOrganizations( lastItem ) {

        // 如果本地有数据暂时不更新，以后会只更新最近修改的
        if ( lastItem !== undefined )
            return;

        var successCallback = function ( items ) {
            items.forEach( function ( item ) {
                 _db.organizations.add( {
                    title: item['title'],
                    geolocation: item['geolocation'],
                    type: item['portal_type'],
                    url: item['@id'],
                } );
            } );
        };

        var failCallback = function ( errMsg ) {
            utils.warning( '同步数据失败: ' + errMsg );
        };

        restapi.queryVillages( successCallback, failCallback );

    }

    //
    // 处理数据同步
    //
    function synchronizeHandler( event ) {

        if ( ! navigator.onLine ) {
            utils.warning( '离线状态无法同步数据' );
            return;
        }

        _db.transaction('rw', _db.organizations, function () {
            // _db.organizations.clear();
            _db.organizations.orderBy( 'id' ).last( requestRemoteOrganizations );
        } ).then( function ( result ) {
            console.log( '数据同步成功' );
        } ).catch( function ( err ) {
            console.log( '数据同步失败: ' + err );
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
    // 查询小区数据
    //
    function queryVillages( callback, title ) {

        _db.transaction( 'r', _db.organizations, function () {
            if ( title === undefined )
                _db.organizations.toArray().then( callback );
            else
                _db.organizations.where( 'title' ).startsWith( title ).toArray().then( callback );
        } );

    }

    //
    // 查询服务器数据
    //
    function queryRemoteOrganizations( perPage, page, callback ) {
        var request = new XMLHttpRequest();
        var url = 'http://snsoffice.com:9098/future/ajax-house-search';
        var params = 'portal_type=Organization&path=/future/organizations';

        request.onerror = function ( event ) {
            utils.warning( '查询组织机构 ' + url + '时出现了错误!' );
        };

        request.onloadend = function() {

            if (request.status != 200) {
                utils.warning( '查询组织机构 ' + url + '失败，服务器返回代码：' + request.status );
                return;
            }
            callback( JSON.parse( request.responseText ) );
        };
        request.open('GET', url + '?' + params + '&perPage=' + perPage + '&page=' + page, true);
        request.send();

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

        queryVillages: queryVillages,

        newSetting: newSetting,

        saveSettings: saveSettings,

    }

});
