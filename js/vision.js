define( [ 'ifuture', 'jquery' ],

function( ifuture, $ ) {

    var Vision = function ( app, opt_options ) {

        ifuture.Component.call( this );

        this.element = document.querySelector( '#vision' );

        // var carousel = this.element.querySelector( '#vision-carousel' );
        // var _clientX;
        // var _SLIDE_THRESHOLD = 60;
        // carousel.addEventListener( 'touchstart', function ( e ) {
        //     _clientX = e.changedTouches[0].clientX;
        // }, false );

        // carousel.addEventListener( 'touchend', function ( e ) {
        //     var x = e.changedTouches[0].clientX;
        //     if ( Math.abs( x - _clientX ) > _SLIDE_THRESHOLD ) {
        //         $( carousel ).carousel( x > _clientX ? 'prev' : 'next' );
        //         e.stopPropagation();
        //     }
        // }, false );

        this.element.querySelector( '#join-living' ).addEventListener( 'click', function ( e ) {
            app.request( 'map', 'openLiving' );
        }, false );
        this._initialized = false;
        this.app_ = app;

        Vision.prototype.resetContent_.call( this );

    }
    ifuture.inherits( Vision, ifuture.Component );

    Vision.prototype.toggle = function ( visible ) {

        var element = this.element;
        visible = ( visible === true || visible === false ) ?  visible : element.style.visibility !== 'visible';
        if ( visible ) {
            if ( ! this._initialized )
                this.resetContent_();
            Array.prototype.forEach.call( document.querySelectorAll( '.dx-mini' ), function ( mini ) {
                mini.style.visibility = 'hidden';
            } );
        }
        element.style.visibility = visible ? 'visible' : 'hidden';
    };

    Vision.prototype.show = function () {
        this.toggle( true );
    };

    Vision.prototype.setViewState = function ( views ) {
        var carousel = this.element.querySelector( '#vision-carousel' );
        // [ 'plane', 'solid', 'three' ].forEach( function ( v ) {
        //     var b = carousel.querySelector( 'button[data-value="' + v + '"]' );
        //     if ( b ) {
        //         views[ v ] ? b.removeAttribute( 'disabled' ) : b.setAttribute( 'disabled', 'disabled' );
        //     }
        // } );
        Array.prototype.forEach.call( carousel.querySelectorAll( 'button[target-name=setVisionType]'), function ( btn ) {
            btn.setAttribute( 'disabled', 'disabled' );
        } );

        if ( views ) {
            views.forEach( function ( v ) {
                var btn = carousel.querySelector( 'button[target-value="' + v.type + '"]' );
                if ( btn )
                    btn.removeAttribute( 'disabled' );
            } );
        }
    };

    Vision.prototype.resetContent_ = function () {

        var carousel = this.element.querySelector( '#vision-carousel' )
        var app = this.app_;

        // carousel.innerHTML =
        //     '<ol class="carousel-indicators">' +
        //     '  <li data-target="#vision-carousel" data-slide-to="0" class="active"></li>' +
        //     '  <li data-target="#vision-carousel" data-slide-to="1"></li>' +
        //     '  <li data-target="#vision-carousel" data-slide-to="2"></li>' +
        //     '</ol>' +
        //     '<div class="carousel-inner">' +
        //     '  <div class="carousel-item active">' +
        //     '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
        //     '      <figure class="figure p-1 w-30" data-basemap="standard">' +
        //     '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/standard.jpg" alt="标准">' +
        //     '        <figcaption class="figure-caption text-center">标准图</figcaption>' +
        //     '      </figure>' +
        //     '      <figure class="figure p-1 w-30" data-basemap="watercolor">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/watercolor.jpg" alt="水彩">' +
        //     '        <figcaption class="figure-caption text-center">水彩图</figcaption>' +
        //     '      </figure>' +
        //     '      <figure class="figure p-1 w-30" data-basemap="aerial">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/aerial.jpg" alt="卫星">' +
        //     '        <figcaption class="figure-caption text-center">卫星图</figcaption>' +
        //     '      </figure>' +
        //     '    </div>' +
        //     '  </div>' +
        //     '  <div class="carousel-item">' +
        //     '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
        //     '      <figure class="figure p-1 w-30" data-viewtype="plane">' +
        //     '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/plan.jpg" alt="平面">' +
        //     '        <figcaption class="figure-caption text-center">平面图</figcaption>' +
        //     '      </figure>' +
        //     '      <figure class="figure p-1 w-30" data-viewtype="solid">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/stereo.jpg" alt="立体">' +
        //     '        <figcaption class="figure-caption text-center">立体图</figcaption>' +
        //     '      </figure>' +
        //     '      <figure class="figure p-1 w-30" data-viewtype="three">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/solid.jpg" alt="三维">' +
        //     '        <figcaption class="figure-caption text-center">三维图</figcaption>' +
        //     '      </figure>' +
        //     '    </div>' +
        //     '  </div>' +
        //     '  <div class="carousel-item">' +
        //     '    <div class="d-flex flex-wrap justify-content-around p-3 mt-4">' +
        //     '      <button type="button" class="btn btn-outline-secondary mb-3 active" data-toggle="button" aria-pressed="false" autocomplete="off" target-name="title">' +
        //     '        <span class="fa-layers fa-fw fa-lg">' +
        //     '          <span class="fa-layers-text" data-fa-transform="shrink-1">T</span>' +
        //     '        </span> 标题' +
        //     '      </button>' +
        //     '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off" target-name="scene">' +
        //     '        <i class="fas fa-map-pin fa-fw fa-lg"></i> 特征' +
        //     '      </button>' +
        //     '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off" target-name="visitor">' +
        //     '        <i class="fas fa-street-view fa-fw fa-lg"></i> 游客' +
        //     '      </button>' +
        //     '      <button type="button" class="btn btn-outline-secondary mb-3" data-toggle="button" aria-pressed="false" autocomplete="off" target-name="anchor">' +
        //     '        <i class="fas fa-map-marker-alt fa-fw fa-lg"></i> 视野' +
        //     '      </button>' +
        //     '    </div>' +
        //     '  </div>' +
        //     '</div>';

        // carousel.innerHTML =
        //     '    <div class="d-flex flex-wrap justify-content-around">' +
        //     '      <figure class="figure m-0 w-30" data-basemap="standard">' +
        //     '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/standard.jpg" alt="标准">' +
        //     '      </figure>' +
        //     '      <figure class="figure m-0 w-30" data-basemap="watercolor">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/watercolor.jpg" alt="水彩">' +
        //     '      </figure>' +
        //     '      <figure class="figure m-0 w-30" data-basemap="aerial">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/aerial.jpg" alt="卫星">' +
        //     '      </figure>' +
        //     '      <figure class="figure m-0 w-30" data-viewtype="plane">' +
        //     '        <img class="figure-img img-fluid rounded p-1 bg-info" src="images/visions/plan.jpg" alt="平面">' +
        //     '      </figure>' +
        //     '      <figure class="figure m-0 w-30" data-viewtype="solid">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/stereo.jpg" alt="立体">' +
        //     '      </figure>' +
        //     '      <figure class="figure m-0 w-30" data-viewtype="three">' +
        //     '        <img class="figure-img img-fluid rounded p-1" src="images/visions/solid.jpg" alt="三维">' +
        //     '      </figure>' +
        //     '</div>';

        // Array.prototype.forEach.call( carousel.querySelectorAll( 'figure[data-basemap]' ), function ( figure ) {
        //     figure.addEventListener( 'click', function ( e ) {
        //         var target = e.currentTarget;
        //         Array.prototype.forEach.call( carousel.querySelectorAll( 'figure[data-basemap] > img' ), function ( img ) {
        //             img.className = 'figure-img img-fluid rounded p-1';
        //         } );
        //         target.firstElementChild.className = 'figure-img img-fluid rounded p-1 bg-info';
        //         app.request( 'map', 'setBaseMap', target.getAttribute( 'data-basemap' ) );
        //     }, false );
        // } );

        // Array.prototype.forEach.call( carousel.querySelectorAll( 'figure[data-viewtype]' ), function ( figure ) {
        //     figure.addEventListener( 'click', function ( e ) {
        //         var target = e.currentTarget;
        //         Array.prototype.forEach.call( carousel.querySelectorAll( 'figure[data-viewtype] > img' ), function ( img ) {
        //             img.className = 'figure-img img-fluid rounded p-1';
        //         } );
        //         target.firstElementChild.className = 'figure-img img-fluid rounded p-1 bg-info';
        //         app.request( 'map', 'setVisionType', target.getAttribute( 'data-viewtype' ) );
        //     }, false );
        // } );

        // Array.prototype.forEach.call( carousel.querySelectorAll( 'button' ), function ( btn ) {
        //     btn.addEventListener( 'click', function ( e ) {
        //         var target = e.currentTarget;
        //         app.request( 'map', 'toggleVisible', target.getAttribute( 'target-name' ) );
        //     }, false );
        // } );

        carousel.innerHTML =
            ' <div class="d-flex flex-wrap justify-content-around my-3">' +
            '  <div class="border-bottom border-secondary py-2">' +
            '      <button type="button" class="btn btn-outline-secondary mb-2 active" target-name="setBaseMap" target-value="standard">标准</button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-2" target-name="setBaseMap" target-value="watercolor">水彩</button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-2" target-name="setBaseMap" target-value="aerial">航拍</button>' +
            '  </div>' +
            '  <div class="border-0 mt-3">' +
            '      <button type="button" class="btn btn-outline-secondary mb-2 active" target-name="setVisionType" target-value="plane" disabled>平面</button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-2" target-name="setVisionType" target-value="solid" disabled>立体</button>' +
            '      <button type="button" class="btn btn-outline-secondary mb-2" target-name="setVisionType" target-value="three" disabled>三维</button>' +
            '  </div>' +
            '</div>';

        Array.prototype.forEach.call( carousel.querySelectorAll( 'button' ), function ( btn ) {
            btn.addEventListener( 'click', function ( e ) {
                var target = e.currentTarget;
                var name = target.getAttribute( 'target-name' );
                var b = carousel.querySelector( 'button.active[target-name="' + name + '"]' );
                if ( b )
                    b.className = 'btn btn-outline-secondary mb-2';
                target.className = 'btn btn-outline-secondary mb-2 active';
                app.request( 'map', target.getAttribute( 'target-name' ), target.getAttribute( 'target-value' ) );
            }, false );
        } );

        this._initialized = true;

    };


    return Vision;

} );
