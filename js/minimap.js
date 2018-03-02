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
// 观众模式（viewer)和主播模式基本相同，除了
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
define( [ 'ifuture', 'ol' ],

function( ifuture, ol ) {

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
                this.minimap_.next();
            else
                this.minimap_.prev();
        }
        else
            this.minimap_.touch();
        return false;
    }


    Minimap = function ( app, map, opt_options ) {
        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};
        var map = app.map.getMap();

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
         * 行为模式: browser, anchor, viewer
         *
         * @type {enum}
         * @private
         */
        this.mode_ = 'browser';

        this.view = new ol.View( {
            center: map.getView().getCenter(),
            zoom: 3,
        } );

        this.ovmap = new ol.Map( {
            target: 'minimap',
            controls: new ol.Collection(),
            interactions: [ new DragAction( this ) ],
            view: this.view,
        } );
        this.ovmap.setLayerGroup( map.getLayerGroup() );

        this.currentIndex = 0;
        this.items = [];

        // 
        // 工具栏
        // 
        var toolbar = this.ovmap.getTargetElement().querySelector( '.dx-toolbar' );

        // 删除图层
        toolbar.querySelector( '#trash-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }, false );

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

    Minimap.prototype.touch = function () {

        var item = this.items[ this.currentIndex ];
        var extent = item.config.extent;
        if ( extent ) {
            var view = this.ovmap.getMap().getView();
            view.fit( extent );
        }

    };

    Minimap.prototype.open = function () {
        // 打开展示橱窗，使用旋转木马显示图层所有图片、全景和视频
        this.ovmap.dispatchEvent( new ItemEvent( 'item:open', this.items[ this.currentIndex ] ) );
    };

    Minimap.prototype.close = function () {

        var item = this.items[ this.currentIndex ];
        item.targetLayer.setVisible( false );

        this.near();

    };

    Minimap.prototype.remove = function () {

        if ( this.currentIndex < 0 )
            return;
        this.items.splice( this.currentIndex, 1 );
        this.near();

    };

    Minimap.prototype.near = function () {

        var index = this.prevItem( this.currentIndex );
        if ( index === -1 )
            index = this.nextItem( this.currentIndex );
        if ( index === -1 ) {
            // this.ovmap.getView().fit();
        }
        else
            this.setCurrentItem( index );

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
        for ( index ++ ; index < this.items.length; index ++ )
            if ( this.items[ index ].targetLayer.getVisible() )
                return index;
        return -1;
    };

    Minimap.prototype.prevItem = function ( index ) {
        for ( index -- ; index > -1; index -- )
            if ( this.items[ index ].targetLayer.getVisible() )
                return index;
        return -1;
    };

    Minimap.prototype.removeItem = function ( index ) {
        this.items.splice( index, 1 );
    };

    Minimap.prototype.setCurrentItem = function ( index ) {

        var item = this.items[ index ];
        this.view_.fit( item.config.extent );
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
