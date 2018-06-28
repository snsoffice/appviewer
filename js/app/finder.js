define( [ 'ifuture', 'config', 'restapi', 'utils', 'db', 'logger' ], function ( ifuture, config, restapi, utils, db, logger ) {

    var _SELECTOR = '.dx-finder';

    var _NAVBAR_BRAND_SELECTOR = '.navbar-brand';
    var _NAVBAR_MENU_SELECTOR = '.navbar-collapse.collapse';
    var _NAVBAR_SEARCH_SELECTOR = 'form.form-inline > button';
    var _NAVBAR_SIGNUP_SELECTOR = '.navbar-nav > a:nth-of-type(1)';
    var _NAVBAR_LOGIN_SELECTOR = '.navbar-nav > a:nth-of-type(2)';
    var _NAVBAR_PROFILE_SELECTOR = '.navbar-nav > a:nth-of-type(3)';
    var _NAVBAR_LOGOUT_SELECTOR = '.navbar-nav > a:nth-of-type(4)';
    var _NAVBAR_MYHOUSE_SELECTOR = '.navbar-nav > a:nth-of-type(5)';

    var _SEARCH_FORM_SELECTOR = '.dx-searchform';
    var _LAST_SEARCH_SELECTOR = 'button:nth-of-type(1)';
    var _SEARCH_BUTTON_SELECTOR = 'button:nth-of-type(2)';
    var _CLEAR_SEARCH_SELECTOR = 'button:nth-of-type(3)';

    var _HOUSE_LIST_SELECTOR = '.dx-houselist';
    var _LOAD_MORE_SELECTOR = '.dx-loadmore';
    var _LOAD_HOUSE_SELECTOR = '.dx-loadhouse';

    var _SEARCH_FORM_TEMPLATE = '                                                                     \
        <form class="p-3 border">                                                                     \
          <div class="form-group form-row">                                                           \
            <label for="select-house-scope" class="col-2 col-form-label">空间</label>                 \
            <div class="col-10">                                                                      \
              <select class="form-control" id="searchHouseScope">                                     \
                <option value="public">公共空间</option>                                              \
                <option value="private">我的空间</option>                                             \
              </select>                                                                               \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="searchHouseVillage" class="col-2 col-form-label">小区</label>                 \
            <div class="col-10">                                                                      \
              <input type="text" class="form-control" id="searchHouseVillage" placeholder="小区名称"> \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="searchHouseType" class="col-2 col-form-label">户型</label>                    \
            <div class="col-10">                                                                      \
              <input type="text" class="form-control" id="searchHouseType" placeholder="户型">        \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="inputHouseArea1" class="col-2 col-form-label">面积</label>                    \
            <div class="col-5">                                                                       \
              <input type="text" class="form-control" id="searchHouseArea1" placeholder="最小值">     \
            </div>                                                                                    \
            <div class="col-5">                                                                       \
              <input type="text" class="form-control" id="searchHouseArea2" placeholder="最大值">     \
            </div>                                                                                    \
          </div>                                                                                      \
          <button type="text" class="btn btn-link" style="visibility: hidden;">上次搜索结果</button>  \
          <button type="text" class="btn btn-primary float-right">搜索</button>                       \
          <button type="text" class="btn btn-primary mx-3 float-right">清空</button>                  \
        </form>';

    var _HOUSE_LIST_TEMPLATE = '                \
        <div class="px-3 py-3 pt-md-5 pb-md-4"> \
          <div class="card-group">              \
          %HOUSES%                              \
          </div>                                \
        </div>                                  \
        <button type="text" class="btn btn-link dx-loadmore">装载更多...</button>';

    var _HOUSE_ITEM_TEMPLATE = '                                                                        \
        <div class="card-deck mb-3 mx-auto dx-house-card">                                              \
          <div class="card mb-4 box-shadow">                                                            \
            <div class="card-footer">%LOCATION%</div>                                                   \
            <div class="card-body">                                                                     \
              <h5 class="card-title"><a href="%URL%" class="text-primary dx-loadhouse">%TITLE%</a></h5> \
              <ul class="list-unstyled text-muted">                                                     \
                %METADATA%                                                                              \
              </ul>                                                                                     \
              <p class="card-text text-right"><small class="text-muted">来自 %USER% 的空间</small></p>  \
            </div>                                                                                      \
          </div>                                                                                        \
        </div>';

    var _HOUSE_QUERY_METADATA = 'metadata_fields=house_location&metadata_fields=house_area&metadata_fields=house_type&metadata_fields=Creator&metadata_fields=modified';

    var _PUBLIC_HOUSE_QUERY = [
        'portal_type=House',
        'review_state=published',
        'sort_on=last_modified',
        'sort_order=descending',
        _HOUSE_QUERY_METADATA
    ].join( '&' );

    var _MY_HOUSE_QUERY = [
        'portal_type=House',
        'Creator=%USERID%',
        'sort_on=last_modified',
        'sort_order=descending',
        _HOUSE_QUERY_METADATA
    ].join( '&' );

    Finder = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        var element = document.querySelector( _SELECTOR );
        element.querySelector( _NAVBAR_BRAND_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.dispatchEvent( new ifuture.Event( 'search:house' ) );
        }, false );

        element.querySelector( _NAVBAR_SEARCH_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'show:searchform' ) );
        }, false );

        element.querySelector( _NAVBAR_SIGNUP_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'signup' ) );
        }, false );

        element.querySelector( _NAVBAR_LOGIN_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'login' ) );
        }, false );

        element.querySelector( _NAVBAR_PROFILE_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'profile' ) );
        }, false );

        element.querySelector( _NAVBAR_LOGOUT_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'logout' ) );
        }, false );

        element.querySelector( _NAVBAR_MYHOUSE_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'search:myhouse' ) );
        }, false );

        element.querySelector( _NAVBAR_MENU_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            e.currentTarget.classList.remove( 'show' );
        }, false );

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._element = element;

        /**
         *
         * 调用 restapi 从服务器返回的搜索结果，参考 https://plonerestapi.readthedocs.io/en/latest/batching.html
         *     {
         *       "@id": "http://.../folder/search",
         *       "batching": {
         *         "@id": "http://.../folder/search?b_size=10&b_start=20",
         *         "first": "http://.../plone/folder/search?b_size=10&b_start=0",
         *         "last": "http://.../plone/folder/search?b_size=10&b_start=170",
         *         "prev": "http://.../plone/folder/search?b_size=10&b_start=10",
         *         "next": "http://.../plone/folder/search?b_size=10&b_start=30"
         *       },
         *       "items": [
         *         "..."
         *       ],
         *       "items_total": 175,
         *     }
         *
         * @private
         * @type {Object}
         */
        this._searchResults = null;

    }
    ifuture.inherits( Finder, ifuture.Component );


    /**
     *
     * 应用程序启动之后调用该函数，进行初始化的一些工作
     *
     * @observable
     * @api
     */
    Finder.prototype.startup = function () {

        var scope = this;

        restapi.queryHouses( _PUBLIC_HOUSE_QUERY ).then( function ( result ) {

            scope.buildHouseList_( result );
            scope.showHouseList_();

        } ).catch( function ( err ) {

            logger.log( err );
            scope.showSearchForm_();

        } ).then( function () {

            scope.show_();
            scope.dispatchEvent( new ifuture.Event( 'hide:loader' ) );
            scope.dispatchEvent( new ifuture.Event( 'finder:ready' ) );

        } );

    };

    /**
     *
     * 事件绑定程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @observable
     * @api
     */
    Finder.prototype.bindFutureEvent = function () {

        this.app.on( 'search:house', this.searchHouse_, this );
        this.app.on( 'show:searchform', this.showSearchForm_, this );
        this.app.on( [ 'user:login', 'user:logout' ], this.resetMenuitems_, this );

        this.app.on( 'search:myhouse', function () {
            this.searchHouse_( _MY_HOUSE_QUERY.replace( '%USERID%', config.userId ) );
        }, this );

        this.app.on( 'house:opened', function () {
            this.hide_();
        }, this );

        this.app.on( 'house:closed', function () {
            this.show_();
        }, this );

    };

    /**
     * 显示搜索器
     *
     * @private
     */
    Finder.prototype.show_ = function () {
        this._element.style.display = 'block';
    };

    /**
     * 隐藏搜索器
     *
     * @private
     */
    Finder.prototype.hide_ = function () {
        this._element.style.display = 'none';
    };

    /**
     * 显示搜索条件
     *
     * @private
     */
    Finder.prototype.showSearchForm_ = function () {
        this._element.querySelector( _SEARCH_FORM_SELECTOR ).style.display = 'block';
        this._element.querySelector( _HOUSE_LIST_SELECTOR ).style.display = 'none';

        if ( ! this._element.querySelector( _SEARCH_FORM_SELECTOR ).firstElementChild )
            this.buildSearchForm_();
    };

    /**
     * 显示搜索条件
     *
     * @private
     */
    Finder.prototype.showHouseList_ = function () {
        this._element.querySelector( _SEARCH_FORM_SELECTOR ).style.display = 'none';
        this._element.querySelector( _HOUSE_LIST_SELECTOR ).style.display = 'block';
    };

    /**
     * 搜索房子
     *
     * query 是字符串格式的搜索条件，如果没有定义，则默认为查询所有公共房子
     *
     * @private
     */
    Finder.prototype.searchHouse_ = function ( query ) {

        var scope = this;
        this.dispatchEvent( new ifuture.Event( 'show:loader' ) );

        query = ! query ? _PUBLIC_HOUSE_QUERY : query;
        restapi.queryHouses( query ).then( function ( result ) {

            scope._element.querySelector( _SEARCH_FORM_SELECTOR + ' ' + _LAST_SEARCH_SELECTOR ).style.visibility = 'visible';
            scope.buildHouseList_( result );
            scope.showHouseList_();

        } ).catch( function ( err ) {

            logger.log( err );

        } ).then( function () {

            scope.dispatchEvent( new ifuture.Event( 'hide:loader' ) );

        } );

    };

    /**
     * 创建房子列表
     *
     * @private
     */
    Finder.prototype.buildHouseList_ = function ( result ) {

        // 判断是否是加载下一页生成的结果，如果这样的话，要保留上一次的搜索结果
        var moreFlag = this._searchResults !== null && this._searchResults.hasOwnProperty( 'batching' ) 
            && result !== null && result.hasOwnProperty( 'batching' ) 
            && result.batching[ '@id' ] === this._searchResults.batching.next;

        this._searchResults = result;

        var houselist = this._element.querySelector( _HOUSE_LIST_SELECTOR );

        if ( result === null || ! result.items_total ) {
            houselist.innerHTML = '<h4 class="mt-5">没有找到符合条件的房子</h4>';
        }

        else {
            var arr = [];
            result.items.forEach( function ( item ) {
                var metadata = '<li>' + item.house_area + '平方米</li><li>' + item.house_type + '</li>';
                var url = item[ '@id' ];
                arr.push( _HOUSE_ITEM_TEMPLATE
                          .replace( '%LOCATION%', item.house_location )
                          .replace( '%TITLE%', item.title )
                          .replace( '%URL%', url )
                          .replace( '%METADATA%', metadata )
                          .replace( '%USER%', item.Creator ? item.Creator : '公共' )
                        );
            } );

            var orig = moreFlag ? houselist.querySelector( 'div.card-group' ).innerHTML : '';
            houselist.innerHTML = _HOUSE_LIST_TEMPLATE.replace( '%HOUSES%', orig + arr.join( '' ) );

            var scope = this;
            Array.prototype.forEach.call( houselist.querySelectorAll( _LOAD_HOUSE_SELECTOR ), function ( a ) {
                a.addEventListener( 'click', function ( e ) {
                    e.preventDefault();
                    scope.dispatchEvent( new ifuture.Event( 'open:house', { url: e.currentTarget.getAttribute( 'href' ) } ) );
                }, false );
            } );

            var loadmore = houselist.querySelector( _LOAD_MORE_SELECTOR );
            if ( result.hasOwnProperty( 'batching' ) ) {
                var url = result.batching.next;
                loadmore.addEventListener( 'click', function ( e ) {
                    e.preventDefault();
                }, false );
                loadmore.style.display = 'block';
            }
            else {
                loadmore.style.display = 'none';
            }
        }

    };

    /**
     * 创建搜索条件
     *
     * @private
     */
    Finder.prototype.buildSearchForm_ = function () {

        var searchform = this._element.querySelector( _SEARCH_FORM_SELECTOR );
        searchform.innerHTML = _SEARCH_FORM_TEMPLATE;

        var scope = this;
        searchform.querySelector( _LAST_SEARCH_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            scope.showHouseList_();
        }, false );

        searchform.querySelector( _CLEAR_SEARCH_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            Array.prototype.forEach.call( searchform.querySelectorAll( 'input' ), function ( input ) {
                input.value = '';
            } );
        }, false );

        searchform.querySelector( _SEARCH_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            doSearch();
        }, false );

        var doSearch = function () {

            query = [ 'portal_type=House' ];

            var searchScope = searchform.querySelector( '#searchHouseScope' ).value.trim();
            var searchTitle = searchform.querySelector( '#searchHouseVillage' ).value.trim();
            var searchType = searchform.querySelector( '#searchHouseType' ).value.trim();
            var searchMinArea = searchform.querySelector( '#searchHouseArea1' ).value.trim();
            var searchMaxArea = searchform.querySelector( '#searchHouseArea2' ).value.trim();

            if ( searchScope === 'private' && config.userId !== null ) {
                query.push( 'Creator=' + config.userId );
            }
            else {
                query.push( 'review_state=published' );
            }
            if ( searchTitle )
                query.push( 'Title=' + searchTitle );

            if ( searchMaxArea && searchMinArea ) {
                query.push( 'house_area.query=[' + searchMinArea + ',' + searchMaxArea + ']' );
                query.push( 'house_area.range=min:max' );

            }
            else if ( searchMinArea ) {
                query.push( 'house_area.query=' + searchMinArea );
                query.push( 'house_area.range=min' );

            }
            else if ( searchMaxArea ) {
                query.push( 'house_area.query=' + searchMaxArea );
                query.push( 'house_area.range=max' );
            }
            scope.searchHouse_( query.join( '&' ) );

        };

    };

    /**
     * 设置菜单是否可用
     *
     * @private
     */
    Finder.prototype.resetMenuitems_ = function () {

        var user = !! config.userId;
        var element = this._element;
        element.querySelector( _NAVBAR_SIGNUP_SELECTOR ).style.display = user ? 'none' : 'block';
        element.querySelector( _NAVBAR_LOGIN_SELECTOR ).style.display = user ? 'none' : 'block';
        element.querySelector( _NAVBAR_LOGOUT_SELECTOR ).style.display = user ? 'block' : 'none';
        element.querySelector( _NAVBAR_MYHOUSE_SELECTOR ).style.display = user ? 'block' : 'none';

    };

    return Finder;

} );
