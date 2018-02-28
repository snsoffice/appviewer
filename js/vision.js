define( [ 'ifuture', 'jquery' ],

function( ifuture, $ ) {

    var Vision = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#vision' );

        var carousel = this.element.querySelector( '#vision-carousel' );
        var _clientX;
        var _SLIDE_THRESHOLD = 60;
        carousel.addEventListener( 'touchstart', function ( e ) {
            _clientX = e.changedTouches[0].clientX;
        }, false );

        carousel.addEventListener( 'touchend', function ( e ) {
            var x = e.changedTouches[0].clientX;
            if ( Math.abs( x - _clientX ) > _SLIDE_THRESHOLD ) {
                $( carousel ).carousel( x > _clientX ? 'prev' : 'next' );
                e.stopPropagation();
            }            
        }, false );

    }
    ifuture.inherits( Vision, ifuture.Component );

    Vision.prototype.toggle = function ( visible ) {

        var element = this.element;
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible ) {
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        }
        element.style.visibility = visible ? 'visible' : 'hidden';
    };

    Vision.prototype.show = function () {
        this.toggle( true );
    }

    Vision.prototype.resizeCarousel = function () {
        this.carousel.resize();
    };


    return Vision;

} );
