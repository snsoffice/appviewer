define( [ 'ifuture', 'jquery', 'toolcase' ],

function( ifuture, $, Toolcase ) {

    ProfileTool = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'profile';
        this.title = '设置';
    }
    ifuture.inherits( ProfileTool, Toolcase );

    ProfileTool.prototype.create = function ( container ) {
        var element = document.createElement( 'DIV' );
        element.className = 'dx-toolcase';

        var html = [
            '<nav class="navbar navbar-expand-sm navbar-light bg-light">' +
            '  <span class="navbar-brand mr-auto"> 设置 </span>' +
            '  <div class="collapse navbar-collapse justify-content-center">' +
            '    <div class="navbar-nav nav-tabs">' +
            '      <a class="nav-item nav-link px-2 active">个人信息</a>' +
            '      <a class="nav-item nav-link px-2" id="map-tab">地图设置</a>' +
            '      <a class="nav-item nav-link px-2 disabled">实名认证</a>' +
            '    </div>' +
            '  </div>' +
            '  <div class="d-block d-sm-none w-50" style="overflow-x: auto;">' +
            '    <div class="navbar-nav flex-row">' +
            '      <a class="nav-item nav-link text-nowrap px-2 active">个人信息</a>' +
            '      <a class="nav-item nav-link text-nowrap px-2">地图设置</a>' +
            '      <a class="nav-item nav-link text-nowrap px-2 disabled">实名认证</a>' +
            '    </div>' +
            '  </div>' +
            '  <button class="bg-light text-secondary border-0 mx-2" type="button"><i class="fas fa-times"></i></button>' +
            '</nav>' +
            '<div class="tab-content">' +
            '  <div class="tab-pane fade show active" role="tabpanel">' +
            '    <form class="p-5 border-bottom">' +
            '      <div class="form-group">' +
            '        <label for="userFullname">用户名称</label>' +
            '        <input type="text" class="form-control" id="userFullname" placeholder="用户名称">' +
            '      </div>' +
            '    </form>' +
            '  </div>' +
            '  <div class="tab-pane fade" role="tabpanel">' +
            '    <form class="p-5 border-bottom">' +
            '      <div class="form-check">' +
            '        <input class="form-check-input" type="checkbox" value="" id="toggle-map-house-feature">' +
            '        <label class="form-check-label" for="toggle-map-house-feature">' +
            '          显示房屋特征' +
            '        </label>' +
            '      </div>' +
            '    </form>' +
            '  </div>' +
            '  <div class="tab-pane fade" role="tabpanel">' +
            '  </div>' +
            '</div>'
        ];


        element.innerHTML = html.join( '' );

        $( '.navbar-nav > a', element ).on( 'click', function ( e ) {
            e.preventDefault();
            var j = $( this ).index() + 1;
            $( '.navbar-nav > a', element ).removeClass( 'active' );
            $( '.navbar-nav > a:nth-child(' + j + ')', element ).addClass( 'active' );

            $( '.tab-content > .tab-pane', element ).removeClass( 'show active' );
            $( '.tab-content > .tab-pane:nth-child(' + j + ')', element ).addClass( 'show active' );
        });

        element.querySelector( 'nav.navbar > button' ).addEventListener( 'click', function ( e ) {
            this.dispatchEvent( new ifuture.Event( 'task:close' ) );
        }.bind( this ), false );

        container.appendChild( element );
    };

    return ProfileTool;

} );
