define( [ 'carousel', 'panorama', 'video5' ],

function ( Carousel, Panorama, Video5 ) {

    function Showcase( options ) {
        this.element_ = document.getElementById( options.target ? options.target : 'showcase' );
        this.visible = false;
        this.mini = true;
        this.viewer = null;
        this.item = undefined;
        this.features = [];

        this.carousel_ = null;
        this.panorama_ = null;
        this.video_ = null;

        this.element_.addEventListener( 'click', Showcase.prototype.play.bind( this ),  false );
    }

    Showcase.prototype.reset = function () {
        if ( this.carousel_ !== null )
            this.carousel_.destroy();
        if ( this.panorama_ !== null )
            this.panorama_.destroy();
        if ( this.video_ !== null )
            this.video_.destroy();

        this.viewer = null;
        this.item = undefined;
        this.features = [];

        this.carousel_ = null;
        this.panorama_ = null;
        this.video_ = null;

    };

    Showcase.prototype.openItem = function ( item ) {
        if ( this.item !== undefined && this.item.name === item.name )
            return;

        this.reset();
        this.carousel_ = new Carousel();

        var data = [];
        item.features.forEach( function ( feature ) {
            var properties = feature.properties;
            this.features.push( properties );
            data.push( '<div data-name="' + properties.name + '">' +
                       '  <img class="owl-lazy" data-src="' + properties.preview + '" alt="' + properties.title + '">' +
                       '</div>' );
        } );
        this.carousel.replace( data.join('') );

    };

    Showcase.prototype.showFeature = function ( item, feature ) {

        this.openItem( item );
        var name = feature.get( 'name' );
        for ( var i = 0; i < this.features.length; i ++ )
            if ( this.features[ i ].name === name ) {
                this.carousel_.show( i );
                break;
            }

    };

    Showcase.prototype.toggle = function () {
        if ( ! this.visible )
            return;
        var element = this.element_;
        var mini = ( element.className === 'dx-mini' );
        e.currentTarget.firstElementChild.className =  mini ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        element.className = mini ? 'dx-fullscreen' : 'dx-mini';
        this.mini = ! mini;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    };

    Showcase.prototype.hide = function () {
        this.element_.style.visibility = 'hidden';
        this.visible = false;
    };

    Showcase.prototype.show = function () {
        this.element_.style.visibility = 'visible';
        this.visible = true;
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    };

    Showcase.prototype.play = function () {

        if ( this.carousel_ === null )
            return;

        var pos = this.carousel_.current();
        if ( pos === null || pos < 0 )
            return;

        var feature = this.features[ pos ];
        var category = feature.category;

        if ( category === 'panorama' ) {

            if ( this.panorama_ === null ) {
                this.panorama_ = new Panorama();
            }
            this.viewer = this.panorama_;
            this.viewer.load( feature.name );
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-eject';

        }

        else if ( category === 'video' ) {
        }

    };

    Showcase.prototype.close = function () {
        if ( this.viewer === null )
            this.hide();
        else {
            // 更新缩略图
            this.viewer.close();
            this.viewer = null;
            document.querySelector( '#close-showcase > i.fa' ).className = 'fa fa-close';
        }
    };

    return Showcase;

});
