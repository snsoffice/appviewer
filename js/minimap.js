//
// 小地图浏览模式（browser）
//
//    游客表示大地图的中心，视野表示当前特征的视野
//
//    左右滑动显示上一级和下一级图层
//
//    点击小地图，大地图切换到小地图所在的图层
//
//    同步按钮，小地图切换到大地图所在图层
//
//    删除按钮，删除当前图层（包括其所有的子图层）
//
// 主播模式（anchor)下的行为
//
//    游客表示观众位置，视野表示主播的视野
//
//    左右滑动显示上一级和下一级图层（一致）
//
//    点击小地图，切换主播位置
//
//    同步按钮和删除按钮，禁用
//
// 观看模式（viewer)和主播模式基本相同，除了
//
//    点击小地图，切换观众位置
//
// 每一个导航项包括
//
//    center
//    resolution
//    rotation
//    layer, 可能为 undefined
//
define( [ 'ifuture', 'ol', 'config', 'db', 'utils' ],

function( ifuture, ol, config, db, utils ) {

    var ItemEvent = function( type, item, opt_feature ) {

        this.propagationStopped = true;
        this.type = type;
        this.target = null;
        this.item = item;
        this.feature = opt_target;

    };

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
                    feature.setId( item.id );
                    feature.setProperties( {
                        category: item.category,
                        icon: item.icon,
                        url: item.url
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
         *
         * 底图类型: watercolor, aerial, road
         *
         * @type {enum}
         * @private
         */
        this.basemapType_ = 'watercolor';

        /**
         *
         * 建筑物视野: plan, stereo, solid
         *
         * @type {enum}
         * @private
         */
        this.visionType_ = 'stereo';


        /**
         *
         * 行为模式: summary, browser, viewer
         *
         * @type {enum}
         * @private
         */
        this.mode_ = 'summary';

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

        this.ovmap = new ol.Map( {
            target: 'minimap',
            layers: layers,
            controls: new ol.Collection(),
            interactions: [ new DragAction( this ) ],
            view: this.view,
        } );

        this.currentIndex = 0;
        this.items = [ topItem ];

        //
        // 事件绑定
        //

        // 打开集簇，进入浏览模式
        app.map.on( 'features:browser', function ( e ) {
            var features = e.argument;
            var dxmap = e.target;

            // 删除原来的浏览图层和所有组织结构图层
            this.removeItem( 1 );

            // 切换到当前浏览图层
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
            this.items.push( item );
            this.currentIndex = 1;

        }.bind( this ) );

        //
        // 工具栏
        //
        var toolbar = this.ovmap.getTargetElement().querySelector( '.dx-toolbar' );

        // 删除图层
        toolbar.querySelector( '#trash-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            if ( this.currentIndex === 0 )
                return;
            this.removeItem( this.currentIndex );
            this.setCurrentItem( this.currentIndex - 1 );
            if ( this.currentIndex === 0 ) {
                this.dxmap_.setViewMode( 'summary' );
            }
        }.bind( this ), false );

        // 同步图层
        toolbar.querySelector( '#syn-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }.bind( this ), false );

    }
    ifuture.inherits( Minimap, ifuture.Component );

    Minimap.prototype.toggle = function ( visible ) {

        var element = this.ovmap.getTargetElement();
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
            var item = this.items[ this.currentIndex ];
            this.ovmap.dispatchEvent( new ItemEvent( 'item:show', item, feature ) );
        }

    };

    Minimap.prototype.touch = function ( coordinate ) {
        
        var d = this.dxmap_;

        if ( this.currentIndex === 0 )
            d.setViewMode( 'summary' );
        else if ( this.currentIndex === 1 )
            d.setViewMode( 'browser' );
        else
            d.setViewMode( 'viewer' );

        var view = this.dxmap_.map.getView();
        view.setCenter( coordinate );

    };

    Minimap.prototype.open = function () {
        // 打开展示橱窗，使用旋转木马显示图层所有图片、全景和视频
        this.ovmap.dispatchEvent( new ItemEvent( 'item:open', this.items[ this.currentIndex ] ) );
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
        return index === this.items.length ? 0 : index;
    };

    Minimap.prototype.prevItem = function ( index ) {
        return index > 0 ? index - 1 : this.items.length - 1;
    };

    Minimap.prototype.removeItem = function ( index ) {
        if ( index === 0 )
            return;

        var layer;
        for ( var i = this.items.length - 1; i >= index; i -- ) {
            var item = this.items.pop();
            if ( item.layer ) {
                layer = item.layer;
            }
        }
        if ( layer ) {
            this.ovmap.removeLayer( layer );
        }
    };

    Minimap.prototype.setCurrentItem = function ( index ) {

        var item = this.items[ index ];
        this.view.setCenter( item.center );
        this.view.setResolution( item.resolution );
        this.currentIndex = index;

    };

    Minimap.prototype.addFeature = function ( feature ) {

        var name = feature.get( 'name' );
        var index = -1;
        for ( var i = 0; i < this.items_.length; i ++ )
            if ( this.items[ i ].name === name ) {
                index = i;
                break;
            }
        if ( index === -1 ) {
            if ( this.currentIndex < 0 )
                this.currentIndex = 0;
            this.items.splice( this.currentIndex, 0, feature.getProperties() );
        }
        return index;

    };

    Minimap.prototype.toggleOrganizations_ = function ( visible ) {

        var target = this.ovmap.getTargetElement();

        if ( visible ) {
            var element = document.createElement( 'div' );
            element.className = 'dx-organizations dx-page bg-light';
            element.style.zIndex = 1;
            element.innerHTML =
                '<ul class="list-group list-group-flush">' +
                '  <li class="list-group-item active">华清鱼汤</li>' +
                '  <li class="list-group-item">西北大学长安校区</li>' +
                '  <li class="list-group-item">绿地世纪城</li>' +
                '</ul>';
            target.appendChild( element );
        }

        else {
            var element = target.querySelector( '.dx-organizations' );
            if ( element )
                target.removeChild( element );
        }
    };

    return Minimap;

} );
