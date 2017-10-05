define( [ 'ol', 'utils' ], function ( ol, utils ) {

    // Class
    function Overview( options ) {

        this.map_ = options.dxmap.getMap();
        this.view_ = new ol.View( {
            center: this.map_.getView().getCenter(),
            zoom: 6,
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
        this.visible_ = !!options.visible;
    }

    Overview.prototype.toggle = function () {

        var element = this.ovmap_.getTargetElement();
        this.visible_ = ! this.visible_;
        element.style.visibility = this.visible_ ? 'visible' : 'hidden';
        return this.visible_;

    };

    return Overview;

});
