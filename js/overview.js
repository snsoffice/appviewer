define( [ 'ol', 'utils' ], function ( ol, utils ) {

    var zoom = 2;
    // Class
    function Overview( options ) {

        this.map_ = options.map;
        this.view_ = new ol.View( {
            center: this.map_.getMap().getView().getCenter(),
            zoom: zoom,
        } );
        // var layer = this.map_.getLayers().item( 0 );
        // var layer = new ol.layer.Tile( { source: new ol.source.OSM() } );
        var layer = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'terrain'
        } );

        this.ovmap_ = new ol.Map( {
            target: options.target,
            controls: new ol.Collection(),
            interactions: new ol.Collection(),
            layers: [ layer ],
            view: this.view_,
        } );
        this.visible = !!options.visible;
    }

    Overview.prototype.toggle = function ( visible ) {

        var element = this.ovmap_.getTargetElement();
        this.visible = ( visible === true || visible === false ) ? visible : ! this.visible;
        element.style.visibility = this.visible ? 'visible' : 'hidden';
        document.dispatchEvent( new Event( 'toggle-overview' ) );

    };


    Overview.prototype.handleFeatureClicked = function ( feature ) {
    };

    return Overview;

});
