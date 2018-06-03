define( [ 'ifuture', 'config', 'db', 'restapi', 'jquery' ],

function( ifuture, config, db, restapi, $ ) {

    var _ID = 'navbar';
    var _BRAND_BUTTON = '#future-domain';
    var _LOGIN_BUTTON = '#login-button';
    var _LOGOUT_BUTTON = '#logout-button';
    var _SIGNUP_BUTTON = '#signup-button';
    var _LIVING_BUTTON = '#living-button';
    var _EDITOR_BUTTON = '#editor-button';
    var _SEARCH_BUTTON = '#searchbox > div > button';
    var _SEARCH_INPUT = '#searchbox > input';
    var _PROFILE_BUTTON = '#profile-button';

    Navbar = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        var element = document.getElementById( _ID );
        this._element = element;

        element.querySelector( _SEARCH_INPUT ).addEventListener( 'input', Navbar.prototype.quickSearch_.bind( this ), false );

        element.querySelector( _SEARCH_BUTTON ).addEventListener( 'click', function ( e ) {
            app.request( 'manager', 'show', 'search' );
        }, false );

        element.querySelector( _BRAND_BUTTON ).addEventListener( 'click', function ( e ) {            
            app.request( 'dialog', 'selectDomain', {
                id: e.currentTarget.getAttribute( 'data-domain' ),
                title: e.currentTarget.getAttribute( 'data-title' ),
            } );
        }, false );

        element.querySelector( _LOGIN_BUTTON ).addEventListener( 'click', function ( e ) {
            app.login();
        }, false );

        element.querySelector( _SIGNUP_BUTTON ).addEventListener( 'click', function ( e ) {
            app.signup();
        }, false );

        element.querySelector( _LOGOUT_BUTTON ).addEventListener( 'click', function ( e ) {
            app.logout();
        }, false );

        element.querySelector( _LIVING_BUTTON ).addEventListener( 'click', function ( e ) {
            app.request( 'map', 'startBroadcast' );
        }, false );

        element.querySelector( _PROFILE_BUTTON ).addEventListener( 'click', function ( e ) {
            app.request( 'manager', 'show', 'profile' );
        }, false );

        Navbar.prototype.resetActionState_.call( this );
        Navbar.prototype.resetBrand_.call( this, config.houseDomain );

    }
    ifuture.inherits( Navbar, ifuture.Component );

    /**
     *
     * 事件处理程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Navbar.prototype.handleFutureEvent = function ( event ) {

        if ( event.type.startsWith( 'user:' ) ) {
            this.resetActionState_();
        }

        else if ( event.type === 'living:start' ) {
            this._element.querySelector( _LIVING_BUTTON ).setAttribute( 'disabled', 'true' );
        }

        else if ( event.type === 'living:end' ) {
            this._element.querySelector( _LIVING_BUTTON ).removeAttribute( 'disabled' );
        }

    };

    /**
     *
     * 快速搜索小区，如果搜索结果只有一个，在地图上显示选中的小区； 如
     * 果有多个小区，弹出选择框，选择一个小区。
     *
     * @private
     */
    Navbar.prototype.quickSearch_ = function () {

        var searchinput = this._element.querySelector( _SEARCH_INPUT );
        $( searchinput ).popover('dispose');

        // if ( ! searchinput.value )
        //     return;

        db.queryVillages( searchinput.value ).then( function ( results ) {

            if ( results.length )
                showSearchResults( results );

        } ).catch( function ( err ) {
            console.log( '快速搜索小区出错: ' + err );
        } );

        var scope = this;
        var showSearchResults = function ( results ) {

            var html = [ '<ul class="list-group list-group-flush">' ];
            html.push( '<li class="list-group-item bg-primary" data-url="' + results[ 0 ].url + '">' + results[ 0 ].title + '</li>' );
            results.splice( 1 ).forEach( function ( item ) {
                html.push( '<li class="list-group-item" data-url="' + item.url + '">' + item.title + '</li>' );
            } );
            html.push( '</ul>' );

            var popover = document.createElement( 'DIV' );
            popover.innerHTML = html.join('');

            popover.addEventListener( 'click', function ( e ) {

                var url = e.target.getAttribute( 'data-url' );
                if ( url ) {
                    popover.querySelector( 'ul > li.bg-primary' ).className = 'list-group-item';
                    e.target.className = 'list-group-item bg-primary';
                    scope.dispatchEvent( new ifuture.Event( 'select:village', url ) );
                }

            }, false );

            $( searchinput ).popover( {
                content: popover,
                html: true,
                trigger: 'focus',
                placement: 'auto',
            } ).popover( 'show' );

        };

    }

    /**
     *
     * 设置导航栏所有动作的状态，根据当前用户状态隐藏或者显示菜单和按钮
     *
     * @private
     */
    Navbar.prototype.resetActionState_ = function () {

        var element = this._element;
        var logon = !! config.userId;

        element.querySelector( '#login-button' ).style.display = logon ? 'none' : '';
        element.querySelector( '#signup-button' ).style.display = logon ? 'none' : '';
        element.querySelector( '#logout-button' ).style.display = logon ? '' : 'none';
        element.querySelector( '#living-button' ).style.display = logon ? '' : 'none';
        element.querySelector( '#editor-button' ).style.display = logon ? '' : 'none';

    };

    /**
     *
     * 设置导航栏所有动作的状态，根据当前用户状态隐藏或者显示菜单和按钮
     *
     * @private
     */
    Navbar.prototype.resetBrand_ = function ( userid, username ) {

        var scope = this;
        var setBrand = function ( userid, username ) {
            var button = scope._element.querySelector( _BRAND_BUTTON );
            var title =  ! userid ? '公众空间' : username + '的空间';
            button.innerHTML = '<i class="fas fa-globe fa-lg"></i> 远景网 - ' + title;
            button.setAttribute( 'data-domain', ! userid ? '' : userid );
            button.setAttribute( 'data-title', title );
        };

        if ( !! username ) {
            setBrand( userid, username );
        }

        else if ( !! userid ) {

            restapi.queryUserFullname( userid ).then( function ( user ) {

                setBrand( userid, user.fullname );

            } ).catch( function ( e ) {

                console.log( 'Query user fullname failed: ' + e );
                setBrand( userid, userid );

            } );
        }

        else {
            setBrand();
        }

    };

    return Navbar;

} );
