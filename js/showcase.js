define( [ 'carousel', 'thumbnail', 'panorama', 'video5' ],

function ( Carousel, Thumbnail, Panorama, Video5 ) {

    function Showcase( options ) {
        this.element_ = document.getElementById( options.target ? options.target : 'showcase' );
        this.visible = false;
        this.mini = true;
        this.viewer = null;
        this.items = [];

        this.carousel_ = new Carousel();
        this.panorama_ = new Panorama();
        this.video_ = new Video5();

        this.element_.addEventListener( 'click', Showcase.prototype.play.bind( this ),  false );
    }

    Showcase.prototype.handleFeatureClicked = function ( feature ) {

        var category = feature.get( 'category' );

        if ( category === 'photo' ) {
        }

        else if ( category === 'panorama' ) {
        }

        else if ( category === 'video' ) {
        }

        else if ( category === 'prophecy' ) {
        }

    }

    Showcase.prototype.showThumbnail = function () {
        new Thumbnail( this ).show();
    }

    Showcase.prototype.toggle = function () {
        if ( ! this.visible )
            return;
        var element = this.element_;
        var mini = ( element.className === 'dx-mini' );
        e.currentTarget.firstElementChild.className =  mini ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        element.className = mini ? 'dx-fullscreen' : 'dx-mini';
        this.mini = ! mini;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    }

    Showcase.prototype.hide = function () {
        this.element_.style.visibility = 'hidden';
        this.visible = false;
    }

    Showcase.prototype.show = function () {
        this.element_.style.visibility = 'visible';
        this.visible = true;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    }

    Showcase.prototype.remove = function () {
    }

    Showcase.prototype.play = function () {
        if ( this.viewer === null ) {
            this.viewer = this.panorama_;
            this.viewer.load();
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-eject';
        }
    }

    Showcase.prototype.close = function () {
        if ( this.viewer === null )
            this.hide();
        else {
            this.viewer.close();
            this.viewer = null;
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-close';
        }
    }

    return Showcase;

});
