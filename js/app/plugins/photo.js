define( [ 'ifuture', 'config', 'ol', 'pannellum', 'jquery', 'app/dialog', 'app/slider' ],

function ( ifuture, config, ol, pannellum, jquery, dialog, Slider ) {

    var _TEMPLATE = '                                                                    \
        <div class="dx-tab bg-dark">                                                     \
         <div class="dx-view-tool mx-3 mb-2">                                            \
           <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle mr-2" \
                   type="button">                                                        \
             <i class="far fa-map fa-lg"></i>                                            \
           </button>                                                                     \
           <button class="btn btn-sm btn-outline-secondary border-0 rounded-circle mr-2" \
                   data-toggle="modal" data-target="#house-galary-dialog" type="button"> \
             <i class="far fa-images fa-lg"></i>                                         \
           </button>                                                                     \
         </div>                                                                          \
       </div>';


     var _GALARY_DIALOG_TEMPLATE = '                                                  \
         <div class="modal fade" id="house-galary-dialog" tabindex="-1" role="dialog" \
              aria-hidden="true">                                                     \
           <div class="modal-dialog modal-dialog-centered" role="document">           \
             <div class="modal-content bg-secondary">                                 \
               <div class="dx-photo-list">                                            \
                 <div class="d-flex justify-content-center">                          \
                   %IMAGES%                                                           \
                 </div>                                                               \
               </div>                                                                 \
             </div>                                                                   \
           </div>                                                                     \
         </div>';

    var _THUMBNAIL_TEMPLATE = '                                                  \
        <img class="p-1" src="%POSTER%" alt="%TITLE%" data-src="%SRC%"           \
             data-index="%INDEX%" data-coordinate="%COORDINATE%" data-direction="%DIRECTION%">';

    var _IMAGE_TEMPLATE = '<img class="%CLASS%" src="%SRC%" alt="%TITLE%" data-index="%INDEX%">';

    var _MINIMAP_SELECTOR = '.dx-overview';
    var _GALARY_SELECTOR = '.dx-galary';
    var _PANORAMA_SELECTOR = '.dx-panorama';
    var _THUMBNAIL_SELECTOR = '.dx-photo-list img[data-index="%INDEX%"]';

    var _TOGGLE_MINIMAP_SELECTOR = 'div.dx-view-tool > button:nth-of-type(1)';
    var _TOGGLE_GALARY_SELECTOR = 'div.dx-view-tool > button:nth-of-type(2)';

    var _LOCATION_MARKER_HEADING_URL = 'images/location_marker_heading.png';
    var _DEFAULT_MAP_SIZE = [ 200, 150 ];
    var _MARKER_ID = 'marker';

    View = function ( app, target ) {

        ifuture.Component.call( this, app );

        /**
         *
         * @public
         * @type {String}
         */
        this.title = '照片全景';

        /**
         * 父视图的选择符
         * @private
         * @type {String}
         */
        this._target = target;

        /**
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._element = null;

        /**
         * 当前对应房子的地址
         * @private
         * @type {String}
         */
        this._url = null;

        /**
         * 房子的属性数据
         * @private
         * @type {Object}
         */
        this._data = null;

        /**
         * 全景照片显示组件
         * @private
         * @type {Object} 包括 pannellum.Viewer 和 scenes 和 visible
         */
        this._panorama = null;

        /**
         * 照片显示组件
         * @private
         * @type {Carousel}
         */
        this._carousel = null;

        /**
         * 导航迷你地图
         * @private
         * @type {ol.Map}
         */
        this._minimap = null;

        /**
         * 在手机左右滑动切换图片的控件
         * @private
         * @type {ifuture.Slider}
         */
        this._slider = null;

    }
    ifuture.inherits( View, ifuture.Component );

    /**
     * 打开照片和全景窗口
     *
     * @public
     */
    View.prototype.open = function ( url, data, options ) {

        this._data = data;

        if ( this._url === url ) {
            this.show_();
            return ;
        }

        if ( this._element !== null )
            this._element.remove();

        if ( this._panorama !== null && this._panorama.viewer )
            this._panorama.viewer.destroy();

        if ( this._carousel !== null )
            this._carousel.destroy();

        this._url = url;

        this.buildView_();
        this.buildMinimap_();
        this.buildPanorama_();
        this.buildGalary_();

        this._element.style.display = 'block';

    };

    /**
     * 关闭照片和全景窗口
     *
     * @public
     */
    View.prototype.close = function () {

        if ( this._element !== null ) {
            this._element.remove();
            this._element = null;
        }

        if ( this._panorama !== null && this._panorama.viewer ) {
            this._panorama.viewer.destroy();
            this._panorama = null;
        }

        if ( this._carousel !== null ) {
            this._carousel.destroy();
            this._carousel = null;
        }

        this._url = null;
        this._data = null;

    }

    /**
     * 隐藏照片和全景窗口
     *
     * @public
     */
    View.prototype.hide = function () {

        this._element.style.display = 'none';

    }

    /**
     * 显示照片和全景窗口，主要是处理窗口大小发生变化之后，全景浏览器和地图不可见问题
     *
     * @private
     */
    View.prototype.show_ = function () {

        this._element.style.display = 'block';

        if ( this._panorama && this._panorama.viewer ) {
            this._panorama.viewer.resizeOnDemand();
        }

        if ( this._minimap ) {
            var size = this._minimap.getSize();
            if ( size === undefined || size[ 0 ] === 0 || size[ 1 ] === 0 ) {
                this._minimap.updateSize();
            }
        }

    }

    /**
     * 左右滑动切换视图事件，事件参数包括两个属性
     *
     *     direction > 0 向右滑动，< 0 向左滑动
     *     fingers   触动时候的手指数目
     *
     * @param {ifutre.Event} event
     * @private
     */
    View.prototype.onSlideEvent_ = function ( event ) {

        var direction = event.argument.direction;
        var fingers = event.argument.fingers;
        var img = this._element.querySelector( _GALARY_SELECTOR + ' img.contain' );
        if ( img ) {
            var index = parseInt( img.getAttribute( 'data-index' ) );
            index = direction > 0 ? index - 1 : index + 1;
            var newimg = this._element.querySelector( _THUMBNAIL_SELECTOR.replace( '%INDEX%', index ) );
            if ( newimg )
                this.selectPhoto_( newimg );
        }

    };

    /**
     * 创建页面对象
     *
     * @private
     */
    View.prototype.buildView_ = function () {

        var element = document.createElement( 'DIV' );
        element.innerHTML = _TEMPLATE;
        element = element.firstElementChild;
        document.querySelector( this._target ).appendChild( element );
        this._element = element;

        var scope = this;

        this._element.querySelector( _TOGGLE_MINIMAP_SELECTOR ).addEventListener( 'click', function ( e ) {

            var m = scope._element.querySelector( _MINIMAP_SELECTOR );
            m.style.display = m.style.display === 'none' ? 'block' : 'none';
            m.querySelector( 'canvas' ).style.display = m.style.display;

        }, false );

        this._element.querySelector( _TOGGLE_GALARY_SELECTOR ).addEventListener( 'click', function ( e ) {
        }, false );

        this.app.on( 'helper:changed', function ( e ) {
            this.changeMarker_( _MARKER_ID, e.argument.coordinate, e.argument.direction );
        }, this );

    };

    /**
     * 创建全景浏览器
     *
     * @private
     */
    View.prototype.buildPanorama_ = function () {

        var container = document.createElement( 'div' );
        container.className = "dx-page dx-panorama";
        this._element.appendChild( container );

        var toCoordinate = function ( str ) {
            var result = [];
            str.split( ',' ).forEach( function ( a ) {
                result.push( parseFloat( a ) );
            } );
            return result;
        };

        var firstScene;
        var scenes = {};
        this._data.features.forEach( function ( feature ) {
            if ( feature.type === 'panorama' ) {
                scenes[ feature.name ] = {
                    name: feature.name,
                    panorama: feature.url,
                    coordinate: toCoordinate( feature.coordinate ),
                    direction: feature.direction,
                };
                if ( firstScene === undefined )
                    firstScene = scenes[ feature.name ];
            }
        } );

        if ( firstScene === undefined ) {
            dialog.info( "这里还没有全景照片" );
            this._panorama = null;
            return;
        }

        var options = {
            autoLoad: true,
            application: this.app,
            scenes: scenes,
            'default': {
                firstScene: firstScene.name,
            }
        };

        this._panorama = {
            current: firstScene.name,
            scenes: scenes,
            viewer: pannellum.viewer( container, options ),
        };

        this.changeMarker_( _MARKER_ID, firstScene.coordinate, firstScene.direction );

    };

    /**
     * 创建照片选择画廊
     *
     * @private
     */
    View.prototype.buildGalary_ = function () {

        var container = document.createElement( 'div' );
        container.className = "w-100 h-100 d-flex justify-content-center dx-galary";
        this._element.appendChild( container );

        this._slider = new Slider( container );
        this._slider.on( Slider.SLIDE_EVENT_NAME, this.onSlideEvent_, this );

        var features = this._data.features;
        if ( ! features.length )
            return ;

        var images = [];
        features.forEach( function ( feature, index ) {
            if ( feature.type === 'photo' ) {
                images.push( _THUMBNAIL_TEMPLATE
                             .replace( '%POSTER%', feature.poster )
                             .replace( '%SRC%', feature.url )
                             .replace( '%TITLE%', feature.name )
                             .replace( '%COORDINATE%', feature.coordinate )
                             .replace( '%DIRECTION%', feature.direction )
                             .replace( '%INDEX%', index ) );
            }
        } );

        var element = document.createElement( 'div' );
        element.innerHTML = _GALARY_DIALOG_TEMPLATE.replace( '%IMAGES%', images.join( '' ) );
        element = element.firstElementChild
        this._element.appendChild( element );

        var scope = this;
        Array.prototype.forEach.call( element.querySelectorAll( 'img' ), function ( img ) {
            img.addEventListener( 'click', function ( e ) {
                scope.selectPhoto_( e.currentTarget );
            }, false );
        } );

    };

    /**
     * 创建导航结构图
     *
     * @private
     */
    View.prototype.buildMinimap_ = function () {

        var img = document.createElement( 'IMG' );
        img.src = _LOCATION_MARKER_HEADING_URL;
        var marker = new ol.Overlay({
            id: _MARKER_ID,
            element: img,
            positioning: 'center-center',
            stopEvent: false,
        });

        var element = document.createElement( 'DIV' );
        element.className = 'dx-overview dx-mini';
        this._element.appendChild( element );
        this._minimap = new ol.Map( {
            target: element,
            interactions: [],
            controls: [],
            overlays: [ marker ],
        } );

        var frame = this._data.frames[ 0 ];
        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( frame.geometry );
        var extent = geometry.getExtent();

        var size = this._minimap.getSize();
        if ( size === undefined || size[ 0 ] === 0 || size[ 1 ] === 0 ) {
            size = _DEFAULT_MAP_SIZE;
            this._minimap.setSize( size );
        }

        var resolution = Math.max( ol.extent.getWidth( extent ) / size[ 0 ], ol.extent.getHeight( extent ) / size[ 1 ] );
        var center = ol.extent.getCenter( extent );
        this._minimap.setView( new ol.View( {
            enableRotation: false,
            resolutions: [ resolution ],
            center: center,
            resolution: resolution,
        } ) );

        var loadImage = function ( image, src ) {
            image.getImage().src = src;
        };

        var source = new ol.source.ImageStatic( {
            crossOrigin: 'anonymous',
            imageExtent: extent,
            url: frame.url,
            imageLoadFunction: loadImage,
        } );

        var layer = new ol.layer.Image( {
            extent: extent,
            source: source,
        } );
        this._minimap.setLayerGroup( new ol.layer.Group( { layers: [ layer ] } ) );

        this._minimap.on( 'singleclick', this.selectPanorama_, this );

    };

    /**
     * 导航地图点击事件的处理函数，点击切换对应的全景图片
     *
     * @param {ol.MapBrowserEvent} evt 地图浏览事件
     * @private
     */
    View.prototype.selectPanorama_ = function ( evt ) {

        if ( this._panorama === null )
            return;

        var scene;
        var x = evt.coordinate[ 0 ], y = evt.coordinate[ 1 ];
        var d = Infinity;
        var scenes = this._panorama.scenes;

        Object.getOwnPropertyNames( this._panorama.scenes ).forEach( function ( name ) {
            var pano = scenes[ name ];
            if ( pano.coordinate ) {
                var x0 = pano.coordinate[ 0 ], y0 = pano.coordinate[ 1 ];
                var d0 = ( x - x0 ) * ( x - x0 ) + ( y - y0 ) * ( y - y0 );
                if ( d0 < d ) {
                    scene = pano;
                    d = d0;
                }
            }
        } );

        if ( scene.name !== this._panorama.current ) {
            this._panorama.current = scene.name;
            this._panorama.viewer.loadScene( scene.name );
        }

        this.changeMarker_( _MARKER_ID, scene.coordinate, scene.direction );

        if ( ! this._panorama.visible ) {
            this._element.querySelector( _PANORAMA_SELECTOR ).style.visibility = 'visible';
            this._panorama.viewer.resizeOnDemand();
            this._panorama.visible = true;
        }

    };

    /**
     * 选择不同的照片
     *
     * @private
     */
    View.prototype.selectPhoto_ = function ( img ) {

        jquery( 'div.modal.fade', this._element ).modal( 'hide' );

        var galary = this._element.querySelector( _GALARY_SELECTOR );
        galary.innerHTML = _IMAGE_TEMPLATE
            .replace( '%CLASS%', 'contain' )
            .replace( '%TITLE%', img.getAttribute( 'alt' ) )
            .replace( '%SRC%', img.getAttribute( 'data-src' ) )
            .replace( '%INDEX%', img.getAttribute( 'data-index' ) );

        if ( this._panorama ) {
            this._element.querySelector( _PANORAMA_SELECTOR ).style.visibility = 'hidden';
            this._panorama.visible = false;
        }

        var direction = parseFloat( img.getAttribute( 'data-direction' ) );
        var coordinate = [];
        img.getAttribute( 'data-coordinate' ).split( ',' ).forEach( function ( s ) {
            coordinate.push( parseFloat( s ) );
        } );
        this.changeMarker_( _MARKER_ID, coordinate, direction );

    };

    /**
     * 修改视野
     *
     * @param {String} name 标志对象名称
     * @param {Array.<number>|null} coordinate 所在的位置坐标
     * @param {number} direction 和正北的角度差，角度值
     * @private
     */
    View.prototype.changeMarker_ = function ( name, coordinate, direction ) {

        if ( this._minimap === null )
            return;

        var marker = this._minimap.getOverlayById( name );
        var element = marker.getElement();
        if ( marker ) {
            if ( coordinate !== null )
                marker.setPosition( coordinate );
            if ( typeof direction === 'number' ) {
                var rotate = 'rotate(' + direction.toFixed( 0 ) + 'deg)';
                element.style.transform = rotate;
                element.style.webkitTransform = rotate;
                element.style.mozTransform = rotate;
                element.style.msTransform = rotate;
            }
        }

    };

    return View;

} );
