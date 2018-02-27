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

        element.querySelector( '#modebar > a.btn' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();

            var html = [ '<ul class="list-group list-group-flush">' ];
            for ( var i = 0 ; i < this.modeList.length; i ++ ) {
                if ( this.modeList[ i ].menuitem )
                    html.push( '<li class="list-group-item" index="' + i + '">' + this.modeList[ i ].menuitem + '</li>' );
            }
            html.push( '</ul>' );

            var popover = document.createElement( 'DIV' );
            popover.innerHTML = html.join('');

            popover.addEventListener( 'click', function ( e ) {

                var target = e.target;
                while ( target && target.tagName.toUpper() !== 'LI' ) {
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

    Modebar.prototype.resetContent_ = function () {
        var modes = this.modeList;
        var n = modes.length;
        var bar = this.element;
        var btn = bar.querySelector( '#modebar > a.btn' );

        // 0 个模式，不显示 modebar
        bar.style.visibility = n ? 'visible' : 'hidden';

        // 1 ~ 2 个模式，使用 btn-sm
        btn.className = btn > 2 ? 'btn btn-outline-dark' : 'btn btn-outline-dark btn-sm';

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

    return Modebar;

} );
