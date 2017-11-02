define( [ 'ifuture', 'showcase', 'pannellum', 'utils' ],

function( ifuture, Showcase, pannellum, utils ) {

    var defaultConfig = {
        'default': {
            firstScene: 'cover'
        },
        scenes: {
            cover: {
                title: '远景网',
                panorama: 'data/html/examplepano.jpg',
            },
        },
    };

    var Panorama = function ( app, opt_options ) {
        Showcase.call( this );

        this.name = 'panorama';
        this.title = '全景';
    }
    ifuture.inherits( Panorama, Showcase );

    Panorama.prototype.open = function ( container, item ) {
        this.viewer_ = pannellum.viewer( 'panorama-container', config );
    };

    Panorama.prototype.close = function () {
    };

    Panorama.prototype.load = function ( scendId, config ) {
        this.viewer_.loadScene( sceneId, targetPitch, targetYaw, targetHfov );
        this.element_.style.visibility = 'visible';
    };

    Panorama.prototype.close = function () {
        this.element_.style.visibility = 'hidden';
    };

    Panorama.prototype.add = function ( sceneId, config ) {
        this.viewer_.addScene( sceneId, config );
    };

    Panorama.prototype.remove = function ( sceneId ) {
        this.viewer_.removeScene( sceneId );
    };

    Panorama.prototype.destroy = function () {
        this.viewer_.destroy();
    };

    return Panorama;

} );
