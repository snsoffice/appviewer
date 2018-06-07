/** 资源管理器
 *
 *    使用旋转木马显示当前图层所有的特征，其中第一个对象当前图层标题，
 *    这样即使没有任何特征，旋转木马也至少有一个对象
 *
 * 浏览模式
 *
 *    点击打开图标，打开对应的对象，例如全景图，同时切换打开图标 为关闭
 *    图标，进入对象模式
 *
 *    touch 对象 等同于打开对象，并且在大地图显示当前对象的位置和视野。
 *    如果对象不可以打开，不切换到对象模式，例如文本就不可以打开
 *
 *    左右滑动，切换对象，切换之后在大地图显示当前对象的位置和视野
 *
 * 观看模式
 *
 *    点击关闭图标，关闭对应的对象
 *    操作对象，例如全景图，对象的位置和视角变化之后同步显示在大地图
 *
 * 直播模式
 *
 *    显示直播视频
 *    点击关闭图标，结束直播或者退出直播
 *
 * 支持的类型
 *
 *     HTML
 *
 *     <div data-name="html" class="d-flex justify-content-center align-items-center">
 *         <h5>远景网</h5>
 *     </div>
 *
 *     <div data-name="html" class="jumbotron jumbotron-fluid">
 *       <div class="container">
 *         <h3 class="display-4">远景网</h3>
 *         <p class="lead">中国有远景，天涯若比邻</p>
 *       </div>
 *     </div>
 *
 *     PHOTO
 *
 *      <div data-name="photo" class="d-flex justify-content-center align-items-center">
 *        <img class="owl-lazy mw-100 mh-100" data-src="URL" alt="TITLE">
 *      </div>
 *
 *     PANORAMA
 *
 *      <div data-name="panorama" class="d-flex justify-content-center align-items-center">
 *        <img class="owl-lazy mw-100 mh-100" data-src="URL" alt="TITLE">
 *      </div>
 *
 *     video5
 *
 *     living
 *
 *  七牛图片瘦身，画质基本不变，存储大小减少，这个是收费的
 *      http://oano6er3n.bkt.clouddn.com/giraffe.jpg?imageslim
 *
 *  七牛图片处理
 *     参考 https://developer.qiniu.com/dora/manual/1279/basic-processing-images-imageview2
 *
 *     poster
 *
 *     http://oano6er3n.bkt.clouddn.com/giraffe.jpg?imageView2/0/w/200/interlace/1
 *
 */

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

        this.app_ = app;

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

            this.onResized();

        }.bind( this ), false );

        element.querySelector( '#toggle-showcase' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();

            if ( ! this.viewname ) {
                this.touchItem();
                e.currentTarget.innerHTML = '<i class="fas fa-times fa-lg"></i>';
            }
            else {
                this.close();
                e.currentTarget.innerHTML = '<i class="fas fa-folder-open fa-lg"></i>';
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

    Explorer.prototype.onResized = function () {

        this.carousel.resize();

        var rect = this.element.getBoundingClientRect();
        Array.prototype.forEach.call( this.element.querySelectorAll( '.dx-showcase video' ), function ( video ) {
            video.setAttribute( 'width', rect.width );
            video.setAttribute( 'height', rect.height );
        } );

    };

    Explorer.prototype.show = function () {
        this.toggle( true );
    }

    Explorer.prototype.open = function ( item ) {
        var plugin = this.findView( item );
        if ( ! plugin )
            return;

        var container = document.createElement( 'DIV' );
        container.className = 'dx-showcase';
        this.element.appendChild( container );

        plugin.open( container, item );
        this.viewname = item.type;
    };

    Explorer.prototype.close = function ( item ) {
        var plugin = this.getPlugin( this.viewname );
        // Replace carousel item with latest image
        var image = plugin.snap();
        plugin.close();
        this.element.querySelector( '.dx-showcase' ).remove();
        this.viewname = null;
    };

    Explorer.prototype.buildItem_ = function ( item ) {
        var html;
        if ( item.type === 'cover' ) {
            // html =
            //     '<div data-name="html" class="text-info h-100 d-flex align-items-center justify-content-center">' +
            //     '  <h3>' + item.title + '</h3>' +
            //     '</div>';
            html =
                '<div class="card mt-3 bg-dark text-white text-center">' +
                '  <div class="card-body">' +
                '    <h5 class="card-title">' + item.title + '</h5>' +
                '    <p class="card-text mt-3 text-muted">' + item.description + '</p>' +
                '  </div>' +
                '</div>';
        }
        else {
            html =
                '<div data-name="' + item.type + '" class="h-100 d-flex align-items-center justify-content-center">' +
                '  <img class="owl-lazy" data-src="' + item.url + '" alt="' + item.title + '">' +
                '</div>';
        }
        return html;
    };

    Explorer.prototype.addItem = function ( item ) {
        var html = this.buildItem_( item );
        var position = this.items.length - 1;
        this.carousel.add( html, position );
        this.items.push( item );
    };

    Explorer.prototype.removeItem = function ( item ) {
    };


    Explorer.prototype.touchItem = function () {
        var position = ( this.carousel.current() - 2 ) % this.items.length;
        if ( position > -1 )
            this.open( this.items[ position ] );
    };

    Explorer.prototype.setItems = function ( items ) {

        var htmls = [];
        if ( items )
            for ( var i = 0; i < items.length; i ++ )
                htmls.push( this.buildItem_( items[ i ] ) );
        this.carousel.replace( htmls.join( '' ) );
        this.items =  items;

        this.carousel.resize();

    };

    Explorer.prototype.findView = function ( item ) {
        if ( item.type )
            return this.plugins[ item.type ];

        var minetype = item.minetype;
        if ( item.mimetype ) {
            for ( var i = 0; i < this.mimetypes.length; i ++ ) {
                var m = this.mimetypes[ i ];
                if ( m[ 1 ].indexOf( mimetype ) > -1 )
                    return m[ 0 ];
            }
        }

    };

    /**
     *
     * 事件处理程序
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Explorer.prototype.handleFutureEvent = function ( event ) {

        if ( event.type === 'carousel:changed' ) {
            var index = event.argument;
            var item = this.items[ index ];
            var pos = item.position;
            var yaw = item.pose === undefined ? 0 : item.pose[ 0 ];
            this.app_.dispatchEvent( new ifuture.Event( 'helper:changed', {
                name: 'visitor',
                position: pos,
                yaw: yaw * 180 / Math.PI
            } ) );
        }

    };

    return Explorer;

} );
