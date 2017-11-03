define( [ 'ifuture', 'showcase', 'videojs', 'utils' ],

function( ifuture, Showcase, videojs, utils ) {

    var Video5 = function ( app, opt_options ) {
        Showcase.call( this );
        this.name = 'video5';
        this.title = '视频';

        this.player = null;
    }
    ifuture.inherits( Video5, Showcase );

    Video5.prototype.open = function ( container, item ) {
        if ( this.player !== null )
            this.player.dispose();

        var video = document.createElement( 'VIDEO' );
        video.autoplay = true;
        video.poster = item.poster;
        video.src = item.url;
        container.appendChild( video );
        this.player = videojs( video );
    };

    Video5.prototype.close = function () {
        if ( !! this.player )
            this.player.dispose();
        this.player = null;
    };

    return Video5;

} );
