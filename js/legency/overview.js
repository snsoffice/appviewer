define( [ 'ol', 'utils', 'thumbnail' ], function ( ol, utils, Thumbnail ) {

    var ItemEvent = function( type, item, opt_feature ) {

        this.propagationStopped = true;
        this.type = type;
        this.target = null;
        this.item = item;
        this.feature = opt_target;

    };

    var DragAction = function( overview ) {

        ol.interaction.Pointer.call( this, {
            handleDownEvent: DragAction.prototype.handleDownEvent,
            handleDragEvent: DragAction.prototype.handleDragEvent,
            handleUpEvent: DragAction.prototype.handleUpEvent
        } );

        this.overview_ = overview;

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
                this.overview_.next();
            else
                this.overview_.prev();
        }
        else
            this.overview_.touch();
        return false;
    }


    function Overview( options ) {

        this.map_ = options.map;
        var map = this.map_.getMap();

        this.view_ = new ol.View( {
            center: map.getView().getCenter(),
            zoom: 3,
        } );
        // var layer = map.getLayers().item( 0 );
        // var layer = new ol.layer.Tile( { source: new ol.source.OSM() } );
        var layer = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'terrain'
        } );

        this.ovmap_ = new ol.Map( {
            target: options.target,
            controls: new ol.Collection(),
            interactions: [ new DragAction( this ) ],
            // view: new ol.View( { zoom: 3 } ),
            layers: [ layer ],
            view: this.view_,
        } );
        // this.ovmap_.setLayerGroup( map.getLayerGroup() );

        this.currentIndex_ = 0;
        this.items = [];
        this.visible = !!options.visible;

    }

    Overview.prototype.on = function ( type, callback ) {
        this.ovmap_.on( type, callback );
    }

    Overview.prototype.toggle = function ( visible ) {

        var element = this.ovmap_.getTargetElement();
        this.visible = ( visible === true || visible === false ) ? visible : ! this.visible;
        element.style.visibility = this.visible ? 'visible' : 'hidden';
        document.dispatchEvent( new Event( 'toggle-overview' ) );

    };

    Overview.prototype.handleFeatureClicked = function ( feature ) {

        var category = feature.get( 'category' );
        if ( category === 'layer' ) {
            var index = this.addFeature( feature );
            this.setCurrentItem( index );
        }
        else {
            var item = this.items[ this.currentIndex_ ];
            this.ovmap_.dispatchEvent( new ItemEvent( 'item:show', item, feature ) );
        }

    };

    Overview.prototype.touch = function () {

        var item = this.items[ this.currentIndex_ ];
        var extent = item.config.extent;
        if ( extent ) {
            var view = this.map_.getMap().getView();
            view.fit( extent );
        }

    };

    Overview.prototype.open = function () {
        // 打开展示橱窗，使用旋转木马显示图层所有图片、全景和视频
        this.ovmap_.dispatchEvent( new ItemEvent( 'item:open', this.items[ this.currentIndex_ ] ) );
    };

    Overview.prototype.close = function () {

        var item = this.items[ this.currentIndex_ ];
        item.targetLayer.setVisible( false );

        this.near();

    };

    Overview.prototype.remove = function () {

        if ( this.currentIndex_ < 0 )
            return;
        this.items.splice( this.currentIndex_, 1 );
        this.near();

    };

    Overview.prototype.near = function () {

        var index = this.prevItem( this.currentIndex_ );
        if ( index === -1 )
            index = this.nextItem( this.currentIndex_ );
        if ( index === -1 ) {
            // this.ovmap_.getView().fit();
        }
        else
            this.setCurrentItem( index );

    };

    Overview.prototype.prev = function () {
        var index = this.prevItem( this.currentIndex_ );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Overview.prototype.next = function () {
        var index = this.nextItem( this.currentIndex_ );
        if ( index !== -1 )
            this.setCurrentItem( index );
    };

    Overview.prototype.nextItem = function ( index ) {
        for ( index ++ ; index < this.items.length; index ++ )
            if ( this.items[ index ].targetLayer.getVisible() )
                return index;
        return -1;
    };

    Overview.prototype.prevItem = function ( index ) {
        for ( index -- ; index > -1; index -- )
            if ( this.items[ index ].targetLayer.getVisible() )
                return index;
        return -1;
    };

    Overview.prototype.removeItem = function ( index ) {
        this.items.splice( index, 1 );
    };

    Overview.prototype.setCurrentItem = function ( index ) {

        var item = this.items[ index ];
        this.view_.fit( item.config.extent );
        this.currentIndex_ = index;

    };

    Overview.prototype.addFeature = function ( feature ) {

        var name = feature.get( 'name' );
        var index = -1;
        for ( var i = 0; i < this.items_.length; i ++ )
            if ( this.items[ i ].name === name ) {
                index = i;
                break;
            }
        if ( index === -1 ) {
            if ( this.currentIndex_ < 0 )
                this.currentIndex_ = 0;
            this.items.splice( this.currentIndex_, 0, feature.getProperties() );
        }
        return index;

    };

    Overview.prototype.showThumbnail = function () {
        new Thumbnail( this ).show();
    };

    return Overview;

});
