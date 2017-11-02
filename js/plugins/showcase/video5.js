define( [ 'ifuture', 'showcase', 'videojs', 'utils' ],

function( ifuture, Showcase, videojs, utils ) {

    var Video5 = function ( app, opt_options ) {
        Showcase.call( this );
        this.name = 'video5';
        this.title = '视频';

        this.element = null;
        this.player = null;
    }
    ifuture.inherits( Video5, Showcase );

    Video5.prototype.open = function ( item ) {
        if ( this.player !== null )
            this.player.dispose();

        this.element = document.createElement( 'DIV' );
        var video = document.createElement( 'VIDEO' );
        video.src = item.url;
        this.player = videojs( video );

        return this.element;
    };

    Video5.prototype.close = function () {
        if ( !! this.player )
            this.player.dispose();
        if ( !! this.element )
            this.element.remove();
        this.element = null;
        this.player = null;
    };

    return Video5;

} );
