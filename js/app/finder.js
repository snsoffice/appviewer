define( [ 'ifuture', 'config', 'restapi', 'utils', 'db', 'logger' ], function ( ifuture, config, restapi, utils, db, logger ) {

    var _SELECTOR = '.dx-finder';
    var _SEARCH_FORM_SELECTOR = '.dx-searchform';
    var _HOUSE_LIST_SELECTOR = '.dx-houselist';
    var _NAVBAR_BRAND_SELECTOR = '.navbar-brand';
    var _SEARCH_BUTTON_SELECTOR = 'form.form-inline > button';

    var _SEARCH_FORM_TEMPLATE = '                                                                     \
        <form class="p-3 border">                                                                     \
          <div class="form-group form-row">                                                           \
            <label for="select-house-scope" class="col-2 col-form-label">空间</label>                 \
            <div class="col-10">                                                                      \
              <select class="form-control" id="select-house-scope">                                   \
                <option value="public">公共空间</option>                                              \
                <option value="private">我的空间</option>                                             \
              </select>                                                                               \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="inputVillage" class="col-2 col-form-label">小区</label>                       \
            <div class="col-10">                                                                      \
              <input type="text" class="form-control" id="inputVillage" placeholder="小区名称">       \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="inputHouseType" class="col-2 col-form-label">户型</label>                     \
            <div class="col-10">                                                                      \
              <input type="text" class="form-control" id="inputHouseType" placeholder="户型">         \
            </div>                                                                                    \
          </div>                                                                                      \
          <div class="form-group form-row">                                                           \
            <label for="inputHouseArea1" class="col-2 col-form-label">面积</label>                    \
            <div class="col-5">                                                                       \
              <input type="text" class="form-control" id="inputHouseArea1" placeholder="最小值">      \
            </div>                                                                                    \
            <div class="col-5">                                                                       \
              <input type="text" class="form-control" id="inputHouseArea2" placeholder="最大值">      \
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
        <button type="text" class="btn btn-link">装载更多...</button>';

    var _HOUSE_ITEM_TEMPLATE = '                                                                       \
        <div class="card-deck mb-3 mx-auto dx-house-card">                                             \
          <div class="card mb-4 box-shadow">                                                           \
            <img class="card-image-top" src="%IMAGE%" alt="房屋缩略图">                                \
            <div class="card-footer">%LOCATION%</div>                                                  \
            <div class="card-body">                                                                    \
              <h5 class="card-title"><a href="%URL%" class="text-primary">%TITLE%</a></h5>             \
              <ul class="list-unstyled text-muted">                                                    \
                %METADATA%                                                                             \
              </ul>                                                                                    \
              <p class="card-text text-right"><small class="text-muted">来自 %USER% 的空间</small></p> \
            </div>                                                                                     \
          </div>                                                                                       \
        </div>';

    Finder = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        var element = document.querySelector( _SELECTOR );
        element.querySelector( _NAVBAR_BRAND_SELECTOR ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.dispatchEvent( new ifuture.Event( 'search:house' ) );
        }, false );

        element.querySelector( _SEARCH_BUTTON_SELECTOR ).addEventListener( 'click', function ( e ) {
            app.dispatchEvent( new ifuture.Event( 'show:searchform' ) );
        }, false );

        this._element = element;

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
        restapi.queryHouses().then( function ( items ) {

            scope.buildHouseList_( items );
            scope.showHouseList_();

        } ).catch( function ( err ) {

            logger.logging( err );
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
     * @private
     */
    Finder.prototype.searchHouse_ = function () {

        var scope = this;
        this.dispatchEvent( new ifuture.Event( 'show:loader' ) );

        restapi.queryHouses().then( function ( items ) {

            scope.buildHouseList_( items );
            scope.showHouseList_();

        } ).catch( function ( err ) {

            logger.logging( err );            

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

        var houselist = this._element.querySelector( _HOUSE_LIST_SELECTOR );

        if ( result === undefined || ! result.items_total ) {
            houselist.innerHTML = '<h4 class="mt-5">没有找到符合条件的房子</h4>';
        }

        else {
            var arr = [];
            result.items.forEach( function ( item ) {
                var metadata = '<li>' + item.house_area + '平方米</li><li>' + item.house_type + '</li>';
                var url = item[ '@id' ];
                arr.push( _HOUSE_ITEM_TEMPLATE
                          .replace( '%IMAGE%', url + '/plan/plan_house.png' )
                          .replace( '%LOCATION%', item.house_location )
                          .replace( '%TITLE%', item.title )
                          .replace( '%URL%', url )
                          .replace( '%METADATA%', metadata )
                          .replace( '%USER%', item.Creator ? item.Creator : '公共' )
                        );
            } );
            houselist.innerHTML = _HOUSE_LIST_TEMPLATE.replace( '%HOUSES%', arr.join( '' ) );
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

    };

    return Finder;

} );
