define( [ 'ifuture', 'config', 'ol', 'pannellum', 'jquery' ], function ( ifuture, config, ol, pannellum, jquery ) {

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
             <div class="modal-content bg-light">                                     \
               <div class="dx-photo-list">                                            \
                 <div class="d-flex h-100">                                           \
                   %IMAGES%                                                           \
                 </div>                                                               \
               </div>                                                                 \
             </div>                                                                   \
           </div>                                                                     \
         </div>';

    var _THUMBNAIL_TEMPLATE = '                                                  \
        <img class="img-fluid p-1" src="%POSTER%" alt="%TITLE%" data-src="%SRC%" \
             data-coordinate="%COORDINATE%" data-direction="%DIRECTION%">';

    var _IMAGE_TEMPLATE = '<img class="img-fluid" src="%SRC%" alt="%TITLE%">';

    var _MINIMAP_SELECTOR = '.dx-overview';
    var _GALARY_SELECTOR = '.dx-galary';
    var _PANORAMA_SELECTOR = '.dx-panorama';

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
         * @type {Object} 包括 pannellum.Viewer 和 scenes
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

        // 全景照片角度发生变化之后的事件
        app.on( 'helper:changed', function ( e ) {
            this.changeMarker_( _MARKER_ID, e.argument.position, e.argument.yaw );
        }, this );

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
            this._element.style.display = 'block';
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
     * 处理左右滑动切换视图事件
     *
     * @param {number} direction < 0 表示向左滑动，> 0 表示向右滑动
     * @param {number} fingers   触点数目
     *
     * @return {boolean} true 事件已经处理； false 事件没有处理
     *
     * @public
     */
    View.prototype.onSlideView = function ( direction, fingers ) {
        if ( fingers === 1 ) {
            return true;
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
            if ( feature.phase_type === 'panorama' ) {
                scenes[ feature.name ] = {
                    name: feature.name,
                    panorama: feature.url,
                    coordinate: toCoordinate( feature.coordinate ),
                    direction: feature.angle,
                };
                if ( firstScene === undefined )
                    firstScene = scenes[ feature.name ];
            }
        } );

        if ( firstScene === undefined ) {
            container.innerHTML = '<p class="text-center mt-5">房屋没有全景照片</p>';
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
        container.className = "w-100 h-100 d-flex justify-content-center align-items-center dx-galary";
        this._element.appendChild( container );

        var images = [];
        this._data.features.forEach( function ( feature ) {
            if ( feature.phase_type === 'photo' ) {
                images.push( _THUMBNAIL_TEMPLATE
                             .replace( '%POSTER%', feature.url )
                             .replace( '%SRC%', feature.url )
                             .replace( '%TITLE%', feature.name )
                             .replace( '%COORDINATE%', feature.coordinate )
                             .replace( '%DIRECTION%', feature.angle ) );
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

        var view = this._data.views[ 0 ];
        var fmt = new ol.format.WKT();
        var geometry = fmt.readGeometry( view.geometry );
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
            url: view.url,
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
        this._element.querySelector( _GALARY_SELECTOR ).style.display = 'none';
        this._element.querySelector( _PANORAMA_SELECTOR ).style.display = 'block';

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
            .replace( '%TITLE%', img.getAttribute( 'alt' ) )
            .replace( '%SRC%', img.getAttribute( 'data-src' ) );

        galary.style.display = 'block';
        this._element.querySelector( _PANORAMA_SELECTOR ).style.display = 'none';

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
     * @param {Array.<number>} coordinate 所在的位置坐标
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
