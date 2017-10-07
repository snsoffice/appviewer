define( [], function () {

    function Toolbox( options ) {
        
        this.backdrop = document.createElement( 'div' );
        this.backdrop.className = 'dx-modal dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        this.backdrop.innerHTML = 
            '<div class="dx-toolbox">' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#" data-trigger="take-photo">' +
            '      <i class="fa fa-camera fa-3x"></i>' +
            '      <br><span>拍照，记录生活</span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#" data-trigger="take-broadcast">' +
            '      <i class="fa fa-video-camera fa-3x"></i>' +
            '      <br><span>直播，展示风采</span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="dx-tool" style="display: none;">' +
            '    <a class="btn btn-lg btn-default" href="#" data-trigger="take-forecast">' +
            '      <i class="fa fa-binoculars fa-3x"></i>' +
            '      <br><span>预言，彰显智慧</span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#" data-trigger="take-navigation">' +
            '      <i class="fa fa-road fa-3x"></i>' +
            '      <br><span>导航，指引人生</span>' +
            '    </a>' +
            '  </div>' +
            '</div>';

        this.backdrop.addEventListener( 'click', Toolbox.prototype.hide.bind( this ), false);
        document.body.appendChild( this.backdrop );

        var handler = function ( e ) {
            document.dispatchEvent( new Event( e.currentTarget.getAttribute( 'data-trigger' ) ) );
        };
        Array.prototype.forEach.call( this.backdrop.querySelectorAll( 'a' ), function ( element ) {
            element.addEventListener( 'click', handler );
        } );

    }

    Toolbox.prototype.show = function () {
        this.backdrop.style.visibility = 'visible';
    }

    Toolbox.prototype.hide = function () {
        this.backdrop.style.visibility = 'hidden';
        this.destroy();
    }

    Toolbox.prototype.destroy = function () {
        this.backdrop.remove();
    }

    return Toolbox;

});
