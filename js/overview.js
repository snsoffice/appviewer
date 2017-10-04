define( [ 'ol' ], function ( ol ) {

    // Class
    function Overview( options ) {
        this.map_ = options.dxmap.getMap();
        this.view_ = new ol.View( {
            center: this.map_.getView().getCenter(),
            zoom: 6,
        } );
        var layer = this.map_.getLayers().item( 0 );
        var layer = new ol.layer.Tile( { source: new ol.source.OSM() } );
        var layer = new ol.layer.Tile( {
            preload: Infinity,
            source: new ol.source.BingMaps( {
                key: 'AtHtvweLfmjJag2BTGXsX0kW-2ExduYJXOU-78cgNz4Y_m7UylYgMmfbEwlYyPPb',
                imagerySet: 'Aerial',
                // use maxZoom 19 to see stretched tiles instead of the BingMaps
                // "no photos at this zoom level" tiles
                maxZoom: 19
            } )
        } );
        // Stamen: terrain, terrain-background, terrain-labels, terrain-lines,
        //         toner, toner-background, toner-labels, toner-lines, toner-hybrid, toner-lite
        //         watercolor
        // var layer = new ol.layer.Tile({
        //     source: new ol.source.Stamen({
        //       layer: 'watercolor'
        //     })
        // });
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
