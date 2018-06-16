// 状态栏用于显示下列内容
//
//     图层版权，例如 OSM，STAMAN 等
//     模式状态
//     当前高度（楼层）
//
// 其中图层版权和模式状态在左下角显示，当前楼层在其右侧单独显示
//
// 点击模式图标会弹出模式菜单，执行相应的动作
//
// 点击高度按钮可以弹出楼层（高度）选择窗口，选择楼层
//
// 内置的应用的模式
//
//     登录       fa-user
//     消息       fa-comment-alt
//     定位       fa-map-marker-alt
//     更多       fa-ellipsis-h
//
// 插件可以设置自己的模式，然后显示在状态栏
//
//     导航       fa-lightbulb
//     直播、回放 fa-video
//
//
// 模式对象
//
//     name       英文 ID
//     title      标题，可选
//     icon       图标名称，例如 "fas fa-lightbulb"
//     menuitem   菜单内容，html 格式的文本
//     callback   菜单点击的回调函数
//     exclusive  是否主模式，只能同时存在一个主模式，也就是说当前模式列表中只能有一个 exclusive 为真
//
// 对外接口
//
//     add
//     update
//     remove
//
define( [ 'ifuture', 'jquery' ],

function( ifuture, $ ) {

    Modebar = function ( app, opt_options ) {
        ifuture.Component.call( this );

        var element = document.getElementById( 'modebar' );
        this.element = element;

        this.mode = '';
        this.modeName = [];
        this.modeList = [];

        this.elevationEnabled = false;

        element.querySelector( '#modebar > a.btn' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();

            var html = [ '<ul class="list-group list-group-flush">' ];
            for ( var i = 0 ; i < this.modeList.length; i ++ ) {
                if ( this.modeList[ i ].menuitem )
                    html.push( '<li class="list-group-item" index="' + i + '"><a href="#" class="list-group-item-action">' + this.modeList[ i ].menuitem + '</a></li>' );
            }
            html.push( '</ul>' );

            var popover = document.createElement( 'DIV' );
            popover.innerHTML = html.join('');

            popover.addEventListener( 'click', function ( e ) {

                var target = e.target;
                while ( target && target.tagName.toUpperCase() !== 'LI' ) {
                    target = target.parentElement;
                }
                var index = parseInt( target.getAttribute( 'index' ) );
                if ( typeof this.modeList[ index ].callback === 'function' )
                    this.modeList[ index ].callback();

            }.bind( this ), false );

            var $btn = $( e.currentTarget ).popover( {
                content: popover,
                html: true,
                trigger: 'focus',
                placement: 'auto',
                } );
            $btn.popover( 'show' );

        }.bind( this ), false );


    }
    ifuture.inherits( Modebar, ifuture.Component );

    Modebar.prototype.add = function ( name, component ) {
        var index = this.modeName.indexOf( name );
        if ( index === -1 ) {
            this.modeName.push( name );
            this.modeList.push( component );
        }
        else
            this.modeList[ index ] = component;

        this.resetContent_();
    };

    Modebar.prototype.update = function ( name, component ) {
        var index = this.modeName.indexOf( name );
        if ( index === -1 ) {
            this.modeName.push( name );
            this.modeList.push( component );
        }
        else {
            var mode = this.modeList[ index ];
            for ( var name in component ) {
                if ( mode.hasOwnProperty( name ) )
                    mode[ name ] = component[ name ];
            }
        }
    };

    Modebar.prototype.remove = function ( name ) {
        if ( name === this.mode )
            this.resetMode();
        var index = this.modeName.indexOf( name );
        if ( index > -1 ) {
            this.modeName.splice( index, 1 );
            this.modeList.splice( index, 1 );
        }

        this.resetContent_();
    };

    Modebar.prototype.setMode = function ( name ) {
        var index = this.modeName.indexOf( name );
        if ( index > -1 && this.mode !== name ) {
            this.resetMode();
            this.mode = name;
        }
        return index;
    };

    Modebar.prototype.resetMode = function () {
        var index = this.mode === '' ? -1 : this.modeName.indexOf( this.mode );
        if ( index > -1 ) {
            if ( typeof this.modeList[ index ].close === 'function' )
                this.modeList[ index ].close();
            this.mode = '';
        }
    };

    Modebar.prototype.setElevations = function ( elevations ) {
        var enabled = elevations && typeof elevations.callback === 'function';                
        if ( enabled ) {
            var btn = document.createElement( 'BUTTON' );
            btn.className = 'btn btn-outline-info btn-sm rounded-circle ml-3';
            btn.name = 'show-elevation-dialog';
            btn.textContent = elevations.title === undefined ? '' : elevations.title;
            btn.addEventListener( 'click', elevations.callback, false );
            this.element.appendChild( btn );
        }
        else {            
            var btn = this.element.querySelector( 'button[name="show-elevation-dialog"]' );
            if ( btn )
                btn.remove();
        }
        this.elevationEnabled = enabled;
    };

    Modebar.prototype.setCurrentElevation = function ( title ) {
        var btn = this.element.querySelector( 'button[name="show-elevation-dialog"]' );
        if ( btn )
            btn.textContent = title === undefined ? '' : title;
    };

    Modebar.prototype.handleFutureEvent = function ( e ) {
        if ( e.type === 'elevation:changed' ) {
            this.setCurrentElevation( e.argument.elevation );
        }
    };

    Modebar.prototype.resetContent_ = function () {
        var modes = this.modeList;
        var n = modes.length;
        var bar = this.element;
        var btn = bar.querySelector( '#modebar > a.btn' );

        // 0 个模式，不显示 modebar
        bar.style.visibility = ( n > 0 || this.elevationEnabled ) ? 'visible' : 'hidden';

        // 1 ~ 2 个模式，使用 btn-sm
        btn.className = 'btn btn-outline-dark' + ( n === 0 ? ' invisible' : n > 2 ? '' : ' btn-sm' );

        if ( n === 1 ) {
            btn.innerHTML =
                '<span class="fa-layers fa-fw">' +
                '  <i class="' + modes[ 0 ].icon + '"></i>' +
                '</span>';
        }

        else if ( n === 2 ) {
            btn.innerHTML =
                '<span class="fa-layers fa-fw">' +
                '  <i class="' + modes[ 0 ].icon + '" data-fa-transform="shrink-5 left-8"></i>' +
                '  <i class="' + modes[ 1 ].icon + '" data-fa-transform="shrink-5 right-8"></i>' +
                '</span>';
        }

        else if ( n === 3 ) {
            btn.innerHTML =
                '<span class="fa-layers fa-fw fa-lg">' +
                '  <i class="' + modes[ 0 ].icon + '" data-fa-transform="shrink-5 up-5"></i>' +
                '  <i class="' + modes[ 1 ].icon + '" data-fa-transform="shrink-5 down-8 left-8"></i>' +
                '  <i class="' + modes[ 2 ].icon + '" data-fa-transform="shrink-5 down-8 right-8"></i>' +
                '</span>';
        }

        else if ( n == 4 ) {
            btn.innerHTML =
                '<span class="fa-layers fa-fw fa-lg">' +
                '  <i class="' + modes[ 0 ].icon + '" data-fa-transform="shrink-5 up-5 left-8"></i>' +
                '  <i class="' + modes[ 1 ].icon + '" data-fa-transform="shrink-5 up-5 right-8"></i>' +
                '  <i class="' + modes[ 2 ].icon + '" data-fa-transform="shrink-5 down-8 left-8"></i>' +
                '  <i class="' + modes[ 3 ].icon + '" data-fa-transform="shrink-5 down-8 right-8"></i>' +
                '</span>';
        }

        else if ( n > 4 ) {
            // 超过 4 个模式，第四个图标显示 fa-ellipsis-h
            btn.innerHTML =
                '<span class="fa-layers fa-fw fa-lg">' +
                '  <i class="' + modes[ n - 1 ].icon + '" data-fa-transform="shrink-5 up-5 left-8"></i>' +
                '  <i class="' + modes[ n - 2 ].icon + '" data-fa-transform="shrink-5 up-5 right-8"></i>' +
                '  <i class="' + modes[ n - 3 ].icon + '" data-fa-transform="shrink-5 down-8 left-8"></i>' +
                '  <i class="fas fa-ellipsis-h" data-fa-transform="shrink-5 down-8 right-8"></i>' +
                '</span>';
        }

    };

    // 不再使用，暂时保留代码
    Modebar.prototype.resetElevationDialog_ = function () {

        var elevations = this.elevations.data;

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        if ( elevations === undefined || elevations.length === 0 ) {

            this.element.querySelector( 'button[data-target=".dx-modal-container"]' ).style.visibility = 'hidden';
        }

        else {
            var title = this.currentElevation === -1 ? '楼层' : elevations[ this.currentElevation ];
            var btn = this.element.querySelector( 'button[data-target=".dx-modal-container"]' );
            btn.textContent = title;
            btn.style.visibility = 'visible';

            var html = [
                '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
                '  <div class="modal-dialog modal-dialog-centered dx-modal-elevation" role="document">' +
                '    <div class="modal-content">' +
                '      <div class="modal-header">' +
                '        <h5 class="modal-title">选择楼层</h5>' +
                '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                '          <span aria-hidden="true">&times;</span>' +
                '        </button>' +
                '      </div>' +
                '      <div class="modal-body">' +
                '        <ul class="list-group list-group-flush text-center">'
            ];

            for( var i = 0; i < elevations.length; i ++ ) {
                if ( i === this.currentElevation )
                    html.push( '          <li class="list-group-item bg-info" data-elevation="' + i + '">' + elevations[ i ] + '</li>' );
                else
                    html.push( '          <li class="list-group-item" data-elevation="' + i + '">' + elevations[ i ] + '</li>' );
            }

            html.push(
                '        </ul>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>'
                );

            var dialog = document.createElement( 'DIV' );
            dialog.innerHTML = html.join( '' );
            document.body.appendChild( dialog.firstElementChild );

            document.querySelector( '.dx-modal-elevation .modal-body > ul' ).addEventListener( 'click', function ( e ) {
                var ul = e.currentTarget;
                for (var i = 0; i < ul.children.length; i++) {
                    ul.children[i].className = 'list-group-item';
                }
                e.target.className = 'list-group-item bg-info';

                this.element.querySelector( 'button[data-target=".dx-modal-container"]' ).textContent = e.target.textContent;
                this.currentElevation = parseInt( e.target.getAttribute( 'data-elevation' ) );

                if ( this.elevations.callback ) {
                    this.elevations.callback( this.elevations.level, this.currentElevation );                    
                }

                $( '.dx-modal-container' ).modal( 'hide' );
                return true;

            }.bind( this ), false );
        }

    };

    return Modebar;

} );
