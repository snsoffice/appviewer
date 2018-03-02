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

        this._initialized = false;

    }
    ifuture.inherits( Vision, ifuture.Component );

    Vision.prototype.toggle = function ( visible ) {

        var element = this.element;
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible ) {
            if ( ! this._initialized )
                this._resetContent();
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        }
        element.style.visibility = visible ? 'visible' : 'hidden';
    };

    Vision.prototype.show = function () {
        this.toggle( true );
    }

    Vision.prototype._resetContent = function () {
        var carousel = this.element.querySelector( '#vision-carousel' )
        carousel.innerHTML =
            '<ol class="carousel-indicators">' +
            '  <li data-target="#vision-carousel" data-slide-to="0" class="active"></li>' +
            '  <li data-target="#vision-carousel" data-slide-to="1"></li>' +
            '  <li data-target="#vision-carousel" data-slide-to="2"></li>' +
            '</ol>' +
            '<div class="carousel-inner">' +
            '  <div class="carousel-item active">' +
            '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/watercolor.jpg" alt="水彩">' +
            '        <figcaption class="figure-caption text-center">水彩图</figcaption>' +
            '      </figure>' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1" src="images/visions/aerial.jpg" alt="卫星">' +
            '        <figcaption class="figure-caption text-center">卫星图</figcaption>' +
            '      </figure>' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1" src="images/visions/road.jpg" alt="道路">' +
            '        <figcaption class="figure-caption text-center">道路图</figcaption>' +
            '      </figure>' +
            '    </div>' +
            '  </div>' +
            '  <div class="carousel-item">' +
            '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/plan.jpg" alt="平面">' +
            '        <figcaption class="figure-caption text-center">平面图</figcaption>' +
            '      </figure>' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1" src="images/visions/stereo.jpg" alt="立体">' +
            '        <figcaption class="figure-caption text-center">立体图</figcaption>' +
            '      </figure>' +
            '      <figure class="figure p-1 w-30">' +
            '        <img class="figure-img img-fluid rounded p-1" src="images/visions/solid.jpg" alt="三维">' +
            '        <figcaption class="figure-caption text-center">三维图</figcaption>' +
            '      </figure>' +
            '    </div>' +
            '  </div>' +
            '  <div class="carousel-item">' +
            '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
            '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off">' +
            '        <span class="fa-layers fa-fw fa-lg">' +
            '          <span class="fa-layers-text" data-fa-transform="shrink-1">T</span>' +
            '        </span> 标题' +
            '      </button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off">' +
            '        <i class="fas fa-map-pin fa-fw fa-lg"></i> 特征' +
            '      </button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off">' +
            '        <i class="fas fa-street-view fa-fw fa-lg"></i> 游客' +
            '      </button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off">' +
            '        <i class="fas fa-map-marker-alt fa-fw fa-lg"></i> 视野' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        carousel.querySelector( 'button' ).addEventListener( 'click', function ( e ) {
            var target = e.target;            
        }, false );

        this._initialized = true;

    };

    return Vision;

} );
