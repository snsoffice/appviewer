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

        var element = this.ovmap.getTargetElement().querySelector( '.dx-toolbar' );
        element.querySelector( '#love-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }, false );
        element.querySelector( '#trash-maplayer' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
        }, false );
        element.querySelector( '#hide-minimap' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            this.toggle( false );
        }.bind( this ), false );

    }
    ifuture.inherits( Minimap, ifuture.Component );

    Minimap.prototype.toggle = function ( visible ) {

        var element = this.ovmap.getTargetElement();
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility == 'hidden';
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

    return Minimap;

} );
