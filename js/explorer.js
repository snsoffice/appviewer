//
// 资源管理器
//
//    使用旋转木马显示当前图层所有的特征，其中第一个条目当前图层标题，
//    这样即使没有任何特征，旋转木马也至少有一个条目
//
// 浏览模式
//
//    点击打开图标，打开对应的条目，例如全景图，同时切换打开图标 为关闭
//    图标，进入条目模式
//
//    touch 条目 等同于打开条目，并且在大地图显示当前条目的位置和视野。
//    如果条目不可以打开，不切换到条目模式，例如文本就不可以打开
//
//    左右滑动，切换条目，切换之后在大地图显示当前条目的位置和视野
//
// 条目模式
//
//    点击关闭图标，关闭对应的条目
//    操作条目，例如全景图，条目的位置和视角变化之后同步显示在大地图
//
// 支持的类型
//
//     html
//
//     <div data-name="html" class="d-flex flex-wrap justify-content-center align-items-center">
//         <h5>远景网</h5>
//     </div>
//
//     <div data-name="html" class="jumbotron jumbotron-fluid">
//       <div class="container">
//         <h3 class="display-4">远景网</h3>
//         <p class="lead">中国有远景，天涯若比邻</p>
//       </div>
//     </div>
//     
//     photo
//     
//      <div data-name="photo" class="d-flex justify-content-center align-items-center">
//        <img class="owl-lazy mw-100 mh-100" data-src="URL" alt="TITLE">
//      </div>
//      
//     panorama
//
//      <div data-name="panorama" class="d-flex justify-content-center align-items-center">
//        <img class="owl-lazy mw-100 mh-100" data-src="URL" alt="TITLE">
//      </div>
//      
//     video5
//     
//     living
//
//  七牛图片瘦身，画质基本不变，存储大小减少
//      http://oano6er3n.bkt.clouddn.com/giraffe.jpg?imageslim
//      
//  七牛图片处理
//     参考 https://developer.qiniu.com/dora/manual/1279/basic-processing-images-imageview2
//
//     poster
//
//     http://oano6er3n.bkt.clouddn.com/giraffe.jpg?imageView2/0/w/200/interlace/1
//     
define( [ 'ifuture', 'carousel' ],

function( ifuture, Carousel ) {

    // Item example {
    //     type: 'photo',
    //     title: 'Chan',
    //     poster: 'html/images/chan-poster.jpg',
    //     mimetype: 'image/jpeg',
    //     url: 'html/images/chan.jpg'
    // }

    var Explorer = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#explorer' );

        // 三种位置： mini, float, fullscreen
        // 目前 float 暂不支持
        this.position_ = 'mini';

        var element = this.element.querySelector( '.dx-toolbar' );
        element.querySelector( '#swap-explorer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();

            if (  this.element.className.indexOf( 'dx-mini') > -1 ) {
                this.element.className = 'dx-explorer dx-page';
                this.position_ = 'fullscreen';
                e.currentTarget.innerHTML = '<i class="fas fa-compress fa-lg"></i>';
                app.request( 'footbar', 'remove', 'explorer' );
            }
            else {
                this.element.className = 'dx-explorer dx-mini';
                this.position_ = 'mini';
                e.currentTarget.innerHTML = '<i class="fas fa-expand fa-lg"></i>';
                app.request( 'footbar', 'add', 'explorer' );
                this.toggle( true );
            }

            this.resizeCarousel();

        }.bind( this ), false );

        element.querySelector( '#toggle-showcase' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();

            if ( ! this.viewname ) {
                this.touchItem();
                e.currentTarget.firstElementChild.className = 'fas fa-times fa-lg';
            }
            else {
                this.close();
                e.currentTarget.firstElementChild.className = 'fas fa-folder-open fa-lg';
            }

        }.bind( this ), false );

        this.carousel = new Carousel( app, opt_options );

        this.plugins = {};
        this.viewname = null;
        this.items = [];
        this.mimetypes = [];

    }
    ifuture.inherits( Explorer, ifuture.Component );

    Explorer.prototype.addPlugin = function ( app, plugin ) {
        var scope = this;
        requirejs( [ plugin.source ], function ( Showcase ) {
            var component = new Showcase( app, plugin.options );
            scope.plugins[ plugin.name ] = component;
            if ( plugin.mimetypes )
                scope.mimetypes.push( [ plugin.name, plugin.mimetypes ] );
        } );
    };

    Explorer.prototype.hasPlugin = function ( name ) {
        return name in this.plugins;
    };

    Explorer.prototype.getPlugin = function ( name ) {
        return this.plugins[ name ];
    };

    Explorer.prototype.toggle = function ( visible ) {

        var element = this.element;
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible && this.position_ === 'mini' ) {
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        }
        element.style.visibility = visible ? 'visible' : 'hidden';

    };

    Explorer.prototype.resizeCarousel = function () {
        this.carousel.resize();
    };

    Explorer.prototype.show = function () {
        this.toggle( true );
    }

    Explorer.prototype.open = function ( item ) {
        var name = this.findView( item );
        if ( ! name )
            return;

        var container = document.createElement( 'DIV' );
        container.className = 'dx-showcase';
        this.element.appendChild( container );

        this.getPlugin( name ).open( container, item );
        this.viewname = name;
    };

    Explorer.prototype.close = function ( item ) {
        var plugin = this.getPlugin( this.viewname );
        // Replace carousel item with latest image
        var image = plugin.snap();
        plugin.close();
        this.element.querySelector( '.dx-showcase' ).remove();
        this.viewname = null;
    };

    Explorer.prototype.addItem = function ( item ) {
        var html =
            '<div data-name="' + item.name + '">' +
            '  <img class="owl-lazy" data-src="' + item.poster + '" alt="' + item.title + '">' +
            '</div>'
        var position = this.items.length - 1;
        this.carousel.add( html, position );
        this.items.push( item );
    };

    Explorer.prototype.removeItem = function ( item ) {
    };


    Explorer.prototype.touchItem = function () {
        var position = ( this.carousel.current() - 1 ) % this.items.length;
        if ( position > -1 )
            this.open( this.items[ position ] );
    };

    Explorer.prototype.setItems = function ( items ) {
        var html =
            '<div data-name="' + item.name + '">' +
            '  <img class="owl-lazy" data-src="' + item.poster + '" alt="' + item.title + '">' +
            '</div>';
        this.carousel.replace( html );
        this.items =  items;
    };

    Explorer.prototype.findView = function ( item ) {
        var mimetype = item.mimetype;
        for ( var i = 0; i < this.mimetypes.length; i ++ ) {
            var m = this.mimetypes[ i ];
            if ( m[1].indexOf( mimetype ) > -1 )
                return m[ 0 ];
        }
    };

    return Explorer;

} );
