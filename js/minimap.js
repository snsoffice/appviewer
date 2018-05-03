/**
 *
 * 迷你地图，导航地图或者缩略地图
 *
 * 概念和定义
 *
 *     _planlayer
 *     _stereolayer
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
 *
 * 小地图迷你模式，当大地图处于显示状态的时候，小地图处于迷你模式
 *
 *     组织机构图层一直是平面图
 *     显示大地图的中心位置
 *
 * 小地图浏览模式（browser）
 *
 *    游客表示大地图的中心，视野表示当前特征的视野
 *
 *    左右滑动显示上一级和下一级图层
 *
 *    点击小地图，大地图切换到小地图所在的图层
 *
 *    同步按钮，小地图切换到大地图所在图层
 *
 *    删除按钮，删除当前图层（包括其所有的子图层）
 *
 * 主播模式（anchor)下的行为
 *
 *    游客表示观众位置，视野表示主播的视野
 *
 *    左右滑动显示上一级和下一级图层（一致）
 *
 *    点击小地图，切换主播位置
 *
 *    同步按钮和删除按钮，禁用
 *
 * 观看模式（viewer)和主播模式基本相同，除了
 *
 *    点击小地图，切换观众位置
 *
 * 每一个导航项包括
 *
 *    center
 *    resolution
 *    rotation
 *    layer, 可能为 undefined
 */
define( [ 'ifuture', 'ol', 'config', 'db', 'utils' ],

function( ifuture, ol, config, db, utils ) {

    var DragAction = function( minimap ) {

        ol.interaction.Pointer.call( this, {
            handleDownEvent: DragAction.prototype.handleDownEvent,
            handleDragEvent: DragAction.prototype.handleDragEvent,
            handleUpEvent: DragAction.prototype.handleUpEvent
        } );

        this.minimap_ = minimap;

        /**
         * @type {ol.Pixel}
         * @private
         */
        this.coordinate_ = null;

        /**
         * @type {Boolean}
         * @private
         */
        this.drag_ = false;

    };
    ol.inherits( DragAction, ol.interaction.Pointer );


    /**
     * @param {ol.MapBrowserEvent} evt Map browser event.
     * @return {boolean} `true` to start the drag sequence.
     */
    DragAction.prototype.handleDownEvent = function( evt ) {
        this.coordinate_ = evt.coordinate;
        this.drag_ = false;
        return true;
    };

    DragAction.prototype.handleDragEvent = function( evt ) {
        this.drag_ = true;
    };

    DragAction.prototype.handleUpEvent = function( evt ) {
        var deltaX = evt.coordinate[ 0 ] - this.coordinate_[ 0 ];
        if ( this.drag_ ) {
            if ( ( evt.coordinate[ 0 ] - this.coordinate_[ 0 ] ) > 0 )
                this.minimap_.prev();
            else
                this.minimap_.next();
        }
        else
            this.minimap_.touch( evt.coordinate );
        return false;
    }

    var topItem = {
        center: [ 12119628.52, 4055386.0 ],
        resolution: 28000.0,
    };

    var featureLoader = function ( extent, resolution, projection ) {

        var source = this;
        var fmt = new ol.format.WKT();

        db.query( function ( items ) {
            items.forEach( function ( item ) {
                var feature = fmt.readFeature( item.geometry );
                if ( feature ) {
                    feature.setProperties( {
                        title: item.title,
                    }, true );
                    source.addFeature( feature );
                }
            } );
        } );

    };

    function styleFunction( feature, resolution ) {

        var size = feature.get( 'features' ).length;
        return new ol.style.Style( {
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill( {
                        color: [ 255, 153, 0, Math.min( 0.81, 0.68 ) ]
                    } )
                } ),
                text: new ol.style.Text( {
                    text: size.toString(),
                    fill: new ol.style.Fill( {
                        color: '#fff'
                    } )
                } ),
            } );

    }

    Minimap = function ( app, map, opt_options ) {

        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};
        this.dxmap_ = app.map;

        /**
         * 当前迷你地图的显示级别，默认是 0
         * @private
         * @type {int}
         */
        this.viewLevel_ = 0;

        /**
         *
         * 行为模式: mini, browser, anchor, viewer
         *
         * @type {enum}
         * @private
         */
        this.mode_ = 'browser';

        // 顶层显示中国总图
        //     图层: 高德, resolution: 28000
        //
        // 下一层显示组织机构分布图
        //     图层: stamen.watercolor / cartodb.voyager, resolution: 300
        //
        // 组织机构上一层
        //     图层: cartodb.voyager，resolution: 10
        //
        this.view = new ol.View( {
            center: topItem.center,
            resolution: topItem.resolution,
        } );

        // var baselayers = [ utils.createPublicMap( ol, { vendor: 'gaode' } ) ];
        // var baselayers = [ utils.createPublicMap( ol, { vendor: 'stamen', layer: 'watercolor' } ) ];
        // var baselayers = [ utils.createPublicMap( ol, { vendor: 'cartodb', layer: 'voyager' } ) ];
        var layers = [
            new ol.layer.Tile( {
                maxResolution: 30000,
                minResolution: 600,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
                } ),
            } ),
            new ol.layer.Tile( {
                maxResolution: 600,
                minResolution: 0.1,
                source: new ol.source.XYZ( {
                    crossOrigin: 'anonymous',
                    url:'http://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                } ),
            } ),
            new ol.layer.Vector( {
                maxResolution: 600,
                minResolution: 10,
                source: new ol.source.Cluster( {
                    distance: config.clusterDistance / 2,
                    source: new ol.source.Vector( { loader: featureLoader, } ),
                } ),
                style: styleFunction
            } ),

            this.dxmap_.planGroup,
            this.dxmap_.stereoGroup,
        ];

        this.ovmap_ = new ol.Map( {
            target: 'minimap',
            layers: layers,
            controls: new ol.Collection(),
            interactions: [ new DragAction( this ) ],
            view: this.view,
        } );


        this.currentIndex = 0;
        this.items_ = [ topItem ];

        var element = document.createElement( 'DIV' );
        element.innerHTML = '<img src="images/geolocation_marker_heading.png" />';
        var marker = new ol.Overlay( {
            id: 'marker',
            positioning: 'center-center',
            element: element,
            stopEvent: false
        } );
        this.ovmap_.addOverlay( marker );

        element = document.createElement( 'DIV' );
        element.className = 'text-danger';
        element.innerHTML = '<i class="fas fa-circle"></i>';
        marker = new ol.Overlay( {
            id: 'center',
            positioning: 'center-center',
            element: element,
            stopEvent: false
        } );
        this.ovmap_.addOverlay( marker );

        //
        // 工具栏
        //
        var toolbar = this.ovmap_.getTargetElement().querySelector( '.dx-toolbar' );

        //
        // 事件绑定
        //

        // 删除图层
        toolbar.querySelector( '#trash-maplayer' ).addEventListener( 'click', function ( e ) {

            e.preventDefault();
            if ( this.currentIndex < 1 )
                return;

            this.removeItem( this.currentIndex );
            this.dxmap_.removeViewLevel( this.currentIndex );

            this.setCurrentItem( this.currentIndex - 1 );
            this.dxmap_.setViewLevel( this.currentIndex );

        }.bind( this ), false );

        // 同步图层，设置迷你地图的显示层次和大地图一致
        toolbar.querySelector( '#syn-maplayer' ).addEventListener( 'click', function ( e ) {

            e.preventDefault();
            this.setCurrentItem( this.dxmap_.viewLevel );

        }.bind( this ), false );

    }
    ifuture.inherits( Minimap, ifuture.Component );

    Minimap.prototype.toggle = function ( visible ) {

        var element = this.ovmap_.getTargetElement();
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

    Minimap.prototype.handleFeatureClicked = function ( feature ) {

        var category = feature.get( 'category' );
        if ( category === 'layer' ) {
            var index = this.addFeature( feature );
            this.setCurrentItem( index );
        }
        else {
            var item = this.items_[ this.currentIndex ];
            this.ovmap_.dispatchEvent( new ItemEvent( 'item:show', item, feature ) );
        }

    };

    Minimap.prototype.touch = function ( coordinate ) {

        var d = this.dxmap_;
        d.setViewLevel( this.currentIndex );
        d.view.setCenter( coordinate );

    };

    Minimap.prototype.open = function () {
        // 打开展示橱窗，使用旋转木马显示图层所有图片、全景和视频
    };

    Minimap.prototype.prev = function () {
        var index = this.prevItem( this.currentIndex );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Minimap.prototype.next = function () {
        var index = this.nextItem( this.currentIndex );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Minimap.prototype.nextItem = function ( index ) {
        index ++;
        return index === this.items_.length ? 0 : index;
    };

    Minimap.prototype.prevItem = function ( index ) {
        return index > 0 ? index - 1 : this.items_.length - 1;
    };

    Minimap.prototype.removeItem = function ( index ) {

        if ( index < 1 )
            return;
        this.items_.splice( index );

    };

    Minimap.prototype.setCurrentItem = function ( index ) {

        var item = this.items_[ index ];
        this.view.setCenter( item.center );
        this.view.setResolution( item.resolution );
        this.currentIndex = index;

    };

    Minimap.prototype.newRegionItem = function ( features ) {

        // ViewLevel.REGION
        var level = 1;

        this.removeItem( level );

        var extent = ol.extent.createEmpty();
        var j, jj;
        for ( j = 0, jj = features.length; j < jj; ++j ) {
            ol.extent.extend( extent, features[ j ].getGeometry().getExtent());
        }
        this.view.fit( extent, { padding: [ 10, 10, 10, 10 ] } );

        var item = {
            center: this.view.getCenter(),
            resolution: this.view.getResolution(),
        };
        this.items_.push( item );
        this.currentIndex = level;

    }

    Minimap.prototype.newNodeItem = function ( level ) {

        // ViewLevel.ORGANIZATION
        if ( level < 2 )
            return;

        this.removeItem( level );

        var layerLevel = level - 2;
        var extent = this.dxmap_.layerStack[ layerLevel ].extent;
        this.view.fit( extent, { padding: [ 10, 10, 10, 10 ] } );

        var item = {
            center: this.view.getCenter(),
            resolution: this.view.getResolution(),
        };
        this.items_.push( item );
        this.currentIndex = level;

    };

    Minimap.prototype.handleMapEvent = function ( e ) {

        if ( e.type === 'node:open' )
            this.newNodeItem( e.argument );

        else if ( e.type === 'cluster:open' )
            this.newRegionItem( e.argument );

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

    };

    return Minimap;

} );
