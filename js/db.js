//
// 数据模块接口，应用从这里读取数据
//
// 封装功能
//
//     远程数据同步
//     本地数据查询
//
define( [ 'dexie', 'restapi', 'config', 'utils' ], function ( Dexie, restapi, config, utils ) {

    // DEBUG:
    // Dexie.delete('ifuture');
    // Dexie.delete('anonymous');

    var _db = new Dexie( 'ifuture' );

    _db.version( 1 ).stores( {

        organizations: '++id, title, type, coordinate, url, description',

    } );

    var _usrdb = new Dexie( config.userId === null ? 'anonymous' : config.userId );

    _usrdb.version( 1 ).stores( {

        settings: '++id, &name, value, description',
        features: 'id, &title, geometry, category, icon, url',
        favorites: '++id, type, title, url, parameters, description',

    } );

    var SettingItem = _usrdb.settings.defineClass( {
        id: Number,
        name: String,
        value: String,
        description: String,

    } );

    SettingItem.prototype.save = function () {

        return _usrdb.settings.put( this );

    }

    function querySettings() {
        _usrdb.transaction( 'r', _usrdb.settings, function () {
            var settings = config.settings;
            _usrdb.settings.each( function ( item ) {
                settings[item.name] = item.value;
            } );
        } );
    }

    function saveSettings() {
        _usrdb.transaction( 'rw', _usrdb.settings, function () {
            var settings = config.settings;
            _usrdb.settings.modify( function( item ) {
                item.value = settings[ item.name ];
            } );
        } );
    }

    function newSetting( name, value ) {
        _usrdb.settings.add( {
            name: name,
            value: valude,
        } );
    }

    var MapOrganization = _db.organizations.defineClass( {

        id: Number,
        title: String,
        type: String,
        coordinate: String,
        url: String,
        description: String,

    } );

    MapOrganization.prototype.save = function () {

        return _db.organizations.put( this );

    }

    // var MapFeature = _usrdb.features.defineClass( {

    //     id: Number,
    //     title: String,
    //     geometry: String,
    //     category: String,
    //     icon: String,
    //     url: String,

    // } );

    // MapFeature.prototype.save = function () {

    //     return _usrdb.features.put( this );

    // }

    // function requestRemoteFeatures( item ) {
    //     var id = item === undefined ? 0 : item.id;
    //     if ( ! id ) {
    //         _db.transaction( 'rw', _db.features, function () {
    //             _db.features.add( {
    //                 id: 1,
    //                 title: '绿地世纪城',
    //                 geometry: 'POINT (12119428.31 4055374.30)',
    //                 category: 'organization',
    //                 url: 'organizations/greenland',
    //             } )
    //             _db.features.add( {
    //                 id: 2,
    //                 title: '西北大学长安校区',
    //                 geometry: 'POINT (12119354.46 4048989.50)',
    //                 category: 'organization',
    //                 url: 'organizations/northwestuniversity',
    //             } );
    //             _db.features.add( {
    //                 id: 3,
    //                 title: '华清池御汤酒店',
    //                 geometry: 'POINT (12156763.90 4077916.87)',
    //                 category: 'organization',
    //                 url: 'organizations/huaqingchi',
    //             } );
    //             _db.features.add( {
    //                 id: 4,
    //                 title: '咸阳国际机场',
    //                 geometry: 'POINT (12107045.45 4088525.52)',
    //                 category: 'organization',
    //                 url: 'organizations/xianyangairport',
    //             } );
    //             return 4;

    //         } ).then( function ( n ) {
    //             console.log( '更新 ' + n + ' 条数据');
    //         } );
    //     }
    // }

    function testOrganizations() {
        return [ 
            {
                id: 1,
                title: '绿地世纪城',
                coordinate: '12119428.31 4055374.30',
                '@type': 'Organization',
                '@id': '/data/villages/greenland',
            },
            {
                id: 2,
                title: '西北大学长安校区',
                coordinate: '12119354.46 4048989.50',
                '@type': 'Organization',
                '@id': '/data/villages/northwestuniversity',
            },
            {
                id: 3,
                title: '华清池御汤酒店',
                coordinate: '12156763.90 4077916.87',
                '@type': 'Organization',
                '@id': '/data/villages/huaqingchi',
            },
            {
                id: 4,
                title: '咸阳国际机场',
                coordinate: '12107045.45 4088525.52',
                '@type': 'Organization',
                '@id': '/data/villages/xianyangairport',
            }
        ];
    }

    //
    // 处理数据同步
    //
    function synchornizeHandler() {

        return _db.organizations.orderBy( 'id' ).last().then( function ( lastItem ) {

            // 如果有本地数据，那么只更新最后一次更新之后服务器修改过的数据
            if ( lastItem !== undefined )
                return [];

            // DEBUG:
            return testOrganizations();
            // return restapi.queryVillages();

        } ).then( function ( items ) {

            _db.transaction('rw', _db.organizations, function () {

                items.forEach( function ( item ) {
                    _db.organizations.add( {
                        title: item['title'],
                        coordinate: item['coordinate'],
                        type: item['@type'],
                        url: item['@id'],
                    } );
                } );

            } );

            return items.length;

        } );

    }

    //
    // 查询本地小区数据
    //
    function queryVillages( title ) {

        return _db.transaction( 'r', _db.organizations, function () {
            return title === undefined
                ? _db.organizations.toArray()
                : _db.organizations.where( 'title' ).startsWith( title ).toArray();
        } );

    }

    //
    // 查询服务器数据
    //
    // function queryRemoteOrganizations( perPage, page, callback ) {
    //     var request = new XMLHttpRequest();
    //     var url = 'http://snsoffice.com:9098/future/ajax-house-search';
    //     var params = 'portal_type=Organization&path=/future/organizations';

    //     request.onerror = function ( event ) {
    //         utils.warning( '查询组织机构 ' + url + '时出现了错误!' );
    //     };

    //     request.onloadend = function() {

    //         if (request.status != 200) {
    //             utils.warning( '查询组织机构 ' + url + '失败，服务器返回代码：' + request.status );
    //             return;
    //         }
    //         callback( JSON.parse( request.responseText ) );
    //     };
    //     request.open('GET', url + '?' + params + '&perPage=' + perPage + '&page=' + page, true);
    //     request.send();

    // }

    //
    // 数据同步的触发条件
    //

    // 网络连接从离线到在线
    // window.addEventListener( 'online', synchornizeHandler, false );

    // 登录成功之后进行数据同步操作
    // document.addEventListener( 'login', synchronizeHandler, false );

    // App 后台切换到前台时候进行数据同步操作
    // document.addEventListener( 'resume', synchronizeHandler, false );

    // App 启动进行数据同步操作
    // synchronizeHandler();

    //
    // 初始化 config.settings
    //
    querySettings();

    return {

        synchornize: synchornizeHandler,

        queryVillages: queryVillages,

        newSetting: newSetting,

        saveSettings: saveSettings,

    }

});
