define( [ 'videojs', 'utils' ], function ( utils, videojs ) {

    function Video5( options ) {
        this.element_ = document.getElementById( 'videos' );
        this.player = null;
    }

    Video5.prototype.load = function ( url ) {
        if ( this.player !== null )
            this.player.dispose();

        this.element_.getElementById( 'videojs-player' ).src = url;

        this.player = videojs( 'videojs-player' );
        this.element_.style.visibility = 'visible';
    };

    Video5.prototype.close = function () {
        this.element_.style.visibility = 'hidden';
    };

    Video5.prototype.add = function ( item ) {
    };

    Video5.prototype.remove = function ( item ) {
    };

    return Video5;

});
