define( [ 'ifuture', 'ol', 'db', 'utils' ],

function( ifuture, ol, db, utils ) {

    // Use EPSG:3857 as default projection

    // My home
    var location = [ 12119628.52, 4055386.0 ];

    // The maximum resolution used to determine the resolution
    // constraint. It is used together with minResolution (or maxZoom) and
    // zoomFactor. If unspecified it is calculated in such a way that the
    // projection's validity extent fits in a 256x256 px tile. If the
    // projection is Spherical Mercator (the default) then maxResolution
    // defaults to 40075016.68557849 / 256 = 156543.03392804097
    var maxResolution = 156543.03392804097;

    // The minimum resolution used to determine the resolution
    // constraint. It is used together with maxResolution (or minZoom)
    // and zoomFactor. If unspecified it is calculated assuming 29
    // zoom levels (with a factor of 2). If the projection is
    // Spherical Mercator (the default) then minResolution defaults to
    // 40075016.68557849 / 256 / Math.pow(2, 28) =
    // 0.0005831682455839253.
    var minResolution = 0.0005831682455839253;

    var resolution = maxResolution;

    Map = function ( app, opt_options ) {
        ifuture.Component.call( this );

        var options = opt_options ? opt_options : {};

        var layer = utils.createPublicMap( ol, {
            vendor: 'stamen',
            layer: 'watercolor'
        } );

        var span = document.createElement( 'SPAN' );
        span.className = 'fa fa-arrow-up';
        var rotate = new ol.control.Rotate( { label: span } );

        this.view = new ol.View( {
            center: location,
            resolution: resolution
        } );
        this.map = new ol.Map( {
            target: options.target ? options.target : 'map',
            // interactions: ol.interaction.defaults().extend( [ new FeatureAction() ] ),
            controls: [ rotate ],
            layers: [ layer ],
            view: this.view,
        } );
    }
    ifuture.inherits( Map, ifuture.Component );

    Map.prototype.addControl = function () {
    };

    return Map;

} );
