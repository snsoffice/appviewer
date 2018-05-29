/**
 *
 * 迷你地图，导航地图或者缩略地图
 *
 * 概念和定义
 *
 *     _planlayer
 *     _solidlayer
 *
 *     houselevel
 *
 *     helper
 *         center
 *         marker, visitor or anchor
 *
 * 状态和模式
 *
 *     overview 和大地图同时显示，作为缩略图使用
 *     birdseye 和展示橱窗同时显示，作为导航图使用
 *
 * 行为和方法
 *
 *     reset 重新设置，和大地图数据同步
 *
 * 消息和事件
 *
 *    同步按钮，小地图切换到大地图所在图层
 *
 *    删除按钮，删除当前图层（包括其所有的子图层）
 *
 * 小地图迷你模式，当大地图处于显示状态的时候，小地图处于迷你模式
 *
 *     组织机构图层一直是平面图
 *     显示大地图的中心位置
 *
 */
define( [ 'ifuture', 'ol', 'config', 'db', 'utils' ],

function( ifuture, ol, config, db, utils ) {

    var MAX_RESOLUTION = 20000;
    var MIDDLE_RESOLUTION = 600;
    var MIN_CLUSTER_RESOLUTION = 10;
    var MIN_RESOLUTION = 0.001;

    var DragAction = function ( minimap ) {

        ol.interaction.Pointer.call( this, {
            handleDownEvent: DragAction.prototype.handleDownEvent,
            handleDragEvent: DragAction.prototype.handleDragEvent,
            handleUpEvent: DragAction.prototype.handleUpEvent
        } );

        /**
         * @type {Minimap}
         * @private
         */
        this._minimap = minimap;

        /**
         * @type {ol.Pixel}
         * @private
         */
        this._coordinate = null;

        /**
         * @type {Boolean}
         * @private
         */
        this._drag = false;

    };
    ol.inherits( DragAction, ol.interaction.Pointer );


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    DragAction.prototype.handleDownEvent = function( evt ) {

        this._coordinate = evt.coordinate;
        this._drag = false;
        return true;

    };

    DragAction.prototype.handleDragEvent = function( evt ) {

        this._drag = true;

    };

    DragAction.prototype.handleUpEvent = function( evt ) {

        var deltaX = evt.coordinate[ 0 ] - this._coordinate[ 0 ];
        if ( this._drag ) {
            if ( ( evt.coordinate[ 0 ] - this._coordinate[ 0 ] ) > 0 )
                this._minimap.prev();
            else
                this._minimap.next();
        }
        else
            this._minimap.touch( evt.coordinate );

        return false;
    }

    function clusterStyleFunction( feature, resolution ) {

        // 透明度和集簇中的特征数目成反比
        var size = feature.get( 'features' ).length;
        var opacity = Math.min( 0.6, 0.4 + Math.sqrt( size ) / 20 );

        return new ol.style.Style( {
            image: new ol.style.Circle({
                radius: 4.0,
                fill: new ol.style.Fill( {
                    color: [ 255, 153, 0, opacity ]
                } )
            } ),
        } );

    }

    var Minimap = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};
        this._dxmap = app.map;

        /**
         *
         * 当前迷你地图的站点级别，默认是 -1
         *
         * @private
         * @type {int}
         */
        this._houselevel = -1;

        /**
         *
         * 行为模式
         *
         * @type {enum} overview, birdseye
         * @private
         */
        this._mode = 'overview';

        this._clusterlayer = new ol.layer.Vector( {
            maxResolution: MAX_RESOLUTION,
            minResolution: MIN_CLUSTER_RESOLUTION,
            source: new ol.source.Cluster( {
                distance: config.clusterDistance,
                source: new ol.source.Vector(),
            } ),
            style: clusterStyleFunction
        } );

        this._planlayer = new ol.layer.Group( {
            layers: [ this._dxmap.planegroup ],
        } );

        this._solidlayer = new ol.layer.Group( {
            layers: [ this._dxmap.solidgroup ],
            visible: false,
        } );

        this.view = new ol.View( { resolution: MAX_RESOLUTION, } );

        var layers = [
            new ol.layer.Tile( {
                maxResolution: MAX_RESOLUTION * 1.1,
                minResolution: MIDDLE_RESOLUTION,
                opacity: 0.6,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                } ),
            } ),
            new ol.layer.Tile( {
                maxResolution: MIDDLE_RESOLUTION,
                minResolution: MIN_RESOLUTION,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                } ),
            } ),
            this._clusterlayer,
            this._planlayer,
            this._solidlayer,

        ];

        this._ovmap = new ol.Map( {
            target: 'minimap',
            layers: layers,
            controls: new ol.Collection(),
            interactions: [ new DragAction( this ) ],
            view: this.view,
        } );


        var element = document.createElement( 'DIV' );
        element.innerHTML = '<img src="images/geolocation_marker_heading.png" />';
        var marker = new ol.Overlay( {
            id: 'marker',
            positioning: 'center-center',
            element: element,
            stopEvent: false
        } );
        this._ovmap.addOverlay( marker );

        element = document.createElement( 'DIV' );
        element.className = 'text-danger';
        element.innerHTML = '<i class="fas fa-circle fa-xs" data-fa-transform="shrink-6"></i>';
        marker = new ol.Overlay( {
            id: 'center',
            positioning: 'center-center',
            element: element,
            stopEvent: false
        } );
        this._ovmap.addOverlay( marker );

        var toolbar = this._ovmap.getTargetElement().querySelector( '.dx-toolbar' );

        // 删除图层
        toolbar.querySelector( '#trash-maplayer' ).addEventListener( 'click', function ( e ) {

            e.preventDefault();
            if ( this._houselevel < 1 )
                return;

            this.setCurrentItem( this._houselevel - 1 );
            
            this.dispatchEvent( new ifuture.Event( 'view:remove', this._houselevel ) );

        }.bind( this ), false );

        // 同步图层，设置迷你地图的显示层次和大地图一致
        toolbar.querySelector( '#syn-maplayer' ).addEventListener( 'click', function ( e ) {

            e.preventDefault();
            this.setCurrentItem( this._dxmap.houselevel );

        }.bind( this ), false );

    }
    ifuture.inherits( Minimap, ifuture.Component );

    Minimap.prototype.toggle = function ( visible ) {

        var element = this._ovmap.getTargetElement();
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible ) {
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        }
        element.style.visibility = visible ? 'visible' : 'hidden';

    };

    Minimap.prototype.show = function () {
        this.toggle( true );
    }

    Minimap.prototype.touch = function ( coordinate ) {

        var d = this._dxmap;
        d.selectSiteLevel_( this._houselevel );

        d.view.animate( {
            center: coordinate,
            duration: 250,
        } );

    };

    Minimap.prototype.open = function () {
        // 打开展示橱窗，使用旋转木马显示图层所有图片、全景和视频
    };

    Minimap.prototype.prev = function () {
        var index = this.prevItem( this._houselevel );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Minimap.prototype.next = function () {
        var index = this.nextItem( this._houselevel );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Minimap.prototype.nextItem = function ( index ) {
        index ++;
        return index >= this._dxmap.housestack.length ? 0 : index;
    };

    Minimap.prototype.prevItem = function ( index ) {
        return index > 0 ? index - 1 : this._dxmap.housestack.length - 1;
    };

    Minimap.prototype.setCurrentItem = function ( index ) {

        if ( index === this._houselevel )
            return;

        var duration = 250;
        var extent = this._dxmap.housestack[ index ].extent;
        var center = ol.extent.getCenter( extent );
        var resolution = Math.min( MAX_RESOLUTION, this.view.getResolutionForExtent( extent ) * 1.1 );
        this.view.animate( {
            center: center,
            resolution: resolution,
            duration: duration,
        } );

        this._houselevel = index;

    };

    Minimap.prototype.setCenter_ = function ( center ) {

        this._ovmap.getOverlayById( 'center' ).setPosition( center );

    };

    /**
     *
     * 事件处理程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Minimap.prototype.handleFutureEvent = function ( event ) {

        if ( event.type === 'site:changed' ) {

            this._clusterlayer.setSource(
                new ol.source.Cluster( {
                    distance: config.clusterDistance / 2,
                    source: this._dxmap.source,
                } )
            );
            this.setCurrentItem( 0 );
            this.setCenter_(  ol.extent.getCenter( this._dxmap.housestack[ this._houselevel ].extent ) );

        }

        else if ( event.type === 'view:opened' ) {

            this.setCurrentItem( this._dxmap.houselevel );
            this.setCenter_(  ol.extent.getCenter( this._dxmap.housestack[ this._houselevel ].extent ) );

        }

    };

    return Minimap;

} );
