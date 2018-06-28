define( [ 'config', 'utils' ], function ( config, utils ) {

    var baseurl = config.portalBaseUrl + '/' + config.portalSiteName;

    var _login = function ( username, password ) {

        return new Promise( function ( resolve, reject ) {

            // DEBUG:
            resolve( 'ATokenForTestItIsNotReallyTokenJustForDebug' );
            if ( true )
                return;

            var url = baseurl + '/@login';
            var xhr = new XMLHttpRequest();

            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'User login return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response.token );
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.responseType = 'json';
            xhr.send( JSON.stringify( {
                login: username,
                password: password,
            } ) );

        } );

    };

    var _logout = function ( token ) {

        return new Promise( function ( resolve, reject ) {

            // DEBUG:
            resolve();
            return;

            var url = baseurl + '/@logout';
            var xhr = new XMLHttpRequest();

            xhr.onloadend = function( e ) {
                if (xhr.status != 204) {
                    console.log( 'User logout return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve();
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.setRequestHeader( 'Authorization', 'Bearer ' + token );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };

    var _loginRenew = function ( token ) {

        return new Promise( function ( resolve, reject ) {

            var url = baseurl + '/@login-renew';
            var xhr = new XMLHttpRequest();

            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'User renew login return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response.token );
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.setRequestHeader( 'Authorization', 'Bearer ' + token );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };

    var _registerUser = function ( username, password, email, fullname ) {

        return new Promise( function ( resolve, reject ) {

            var url = baseurl + '/@users';
            var xhr = new XMLHttpRequest();

            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'Register user return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response );
                }
            };

            xhr.open('POST', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.responseType = 'json';
            xhr.send( JSON.stringify( {
                username: username,
                email: email,
                fullname: fullname,
                sendPasswordReset: false,
                password: password,
            } ) );

        } );

    };

    //
    // 查询上一次更新之后的所有新发布的小区
    //
    var _queryVillages = function () {

        return new Promise( function ( resolve, reject ) {

            var xhr = new XMLHttpRequest();
            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'Query organizations return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response.items );
                }
            };

            var url = baseurl + '/@search';
            var params = 'path.query=/future/data/villages&path.depth=1&metadata_fields=coordinate';

            xhr.open('GET', url + '?' + params, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };

    //
    // 查询对象的全部属性
    //
    var _queryObject = function ( url, callback, failCallback ) {

        var xhr = new XMLHttpRequest();
        xhr.onloadend = function( e ) {

            if (xhr.status != 200) {
                console.log( 'Query object ' + url + ' return ' + xhr.status + ' : ' + e );
                if ( typeof failCallback === 'function' )
                    failCallback( e );
                return;
            }

            if ( typeof callback === 'function' )
                callback( xhr.response );
        };

        var params = 'include_items=false';

        xhr.open('GET', url + '?' + params, true);
        xhr.setRequestHeader( 'Accept', 'application/json' );
        xhr.setRequestHeader( 'Content-Type', 'application/json' );
        if ( config.loginToken )
            xhr.setRequestHeader( 'Authorization', 'Bearer ' + config.loginToken );
        xhr.responseType = 'json';
        xhr.send();

    };

    //
    // 查询所有的用户
    //
    var _queryUsers = function ( callback, failCallback ) {

        var url = baseurl + '/@vocabularies/plone.app.vocabularies.Users';
        var xhr = new XMLHttpRequest();
        xhr.onloadend = function( e ) {

            if (xhr.status != 200) {
                console.log( 'Query users ' + url + ' return ' + xhr.status + ' : ' + e );
                if ( typeof failCallback === 'function' )
                    failCallback( e );
                return;
            }

            if ( typeof callback === 'function' )
                callback( xhr.response );
        };


        xhr.open('GET', url, true);
        xhr.setRequestHeader( 'Accept', 'application/json' );
        xhr.setRequestHeader( 'Content-Type', 'application/json' );
        xhr.responseType = 'json';
        xhr.send();

    };

    //
    // 查询指定用户的信息, restapi 需要管理用户权限
    //
    var _queryUser = function ( usrid, callback, failCallback ) {

        var url = baseurl + '/@users/' + userid;
        var xhr = new XMLHttpRequest();
        xhr.onloadend = function( e ) {

            if (xhr.status != 200) {
                console.log( 'Query user ' + usrid + ' return ' + xhr.status + ' : ' + e );
                if ( typeof failCallback === 'function' )
                    failCallback( e );
                return;
            }

            if ( typeof callback === 'function' )
                callback( xhr.response );
        };


        xhr.open('GET', url, true);
        xhr.setRequestHeader( 'Accept', 'application/json' );
        xhr.setRequestHeader( 'Content-Type', 'application/json' );
        xhr.responseType = 'json';
        xhr.send();

    };

    //
    // 查询用户的全名，使用自己定义的帮助视图，返回 { id, fullname }
    // 不需要额外权限，匿名用户也可以使用
    //
    var _queryUserInfo = function ( userid ) {

        return new Promise( function ( resolve, reject ) {

            var xhr = new XMLHttpRequest();
            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'Query fullname of user return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response );
                }
            };

            var url = baseurl + '/getUserFullname?userid=' + userid;
            xhr.open('GET', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };


    //
    // 查询对象的配置文件
    //
    var _queryHouseConfig = function ( url ) {

        return new Promise( function ( resolve, reject ) {

            var xhr = new XMLHttpRequest();
            xhr.onloadend = function( e ) {
                if (xhr.status != 200) {
                    console.log( 'Query house config return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response );
                }
            };

            xhr.open('GET', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            if ( config.loginToken )
                xhr.setRequestHeader( 'Authorization', 'Bearer ' + config.loginToken );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };

    //
    // 搜索房子
    //
    var _queryHouses = function ( query ) {

        var url = baseurl + '/@search?' + query;
        // DEBUG: for local debug
        url = '/data/villages';

        return new Promise( function ( resolve, reject ) {

            var xhr = new XMLHttpRequest();
            xhr.onloadend = function( e ) {
                // DEBUG: for local debug
                resolve( {
                    items_total: 3,
                    items: [
                        {
                            '@id': '/data/villages/greenland/building/1701',
                            house_location: '绿地世纪城A区 - 11号楼',
                            title: '1701',
                            house_area: 69.56,
                            house_type: '一室两厅',
                            Creator: 'zhaojunde',
                        },
                        {
                            '@id': '/data/villages/greenland/building/1701',
                            house_location: '绿地世纪城A区 - 11号楼',
                            title: '1701',
                            house_area: 69.56,
                            house_type: '一室两厅',
                            Creator: 'zhaojunde',
                        },
                        {
                            '@id': '/data/villages/greenland/building/1701',
                            house_location: '绿地世纪城A区 - 11号楼',
                            title: '1701',
                            house_area: 69.56,
                            house_type: '一室两厅',
                            Creator: 'zhaojunde',
                        }
                    ] } );
                return;

                if (xhr.status != 200) {
                    console.log( 'Query houses return ' + xhr.status + ' : ' + e );
                    reject( e );
                }
                else {
                    resolve( xhr.response );
                }
            };

            xhr.open('GET', url, true);
            xhr.setRequestHeader( 'Accept', 'application/json' );
            xhr.setRequestHeader( 'Content-Type', 'application/json' );
            if ( config.loginToken )
                xhr.setRequestHeader( 'Authorization', 'Bearer ' + config.loginToken );
            xhr.responseType = 'json';
            xhr.send();

        } );

    };

    return {

        login: _login,

        logout: _logout,

        loginRenew: _loginRenew,

        registerUser: _registerUser,

        queryVillages: _queryVillages,

        queryUsers: _queryUsers,

        queryUser: _queryUser,

        queryUserInfo: _queryUserInfo,

        queryObject: _queryObject,

        queryHouses: _queryHouses,

        queryHouseConfig: _queryHouseConfig,

    }

} );
