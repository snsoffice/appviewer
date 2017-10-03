define( [], function () {

    function Toolbox( options ) {
        
        this.backdrop = document.createElement( 'div' );
        this.backdrop.className = 'dx-modal dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        this.backdrop.innerHTML = 
            '<div class="dx-toolbox">' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#">' +
            '      <i class="fa fa-camera fa-3x"></i>' +
            '      <br><span>拍照，记录生活</span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#">' +
            '      <i class="fa fa-video-camera fa-3x"></i>' +
            '      <br><span>直播，展示风采</span>' +
            '    </a>' +
            '  </div>' +
            '  <div class="dx-tool">' +
            '    <a class="btn btn-lg btn-default" href="#">' +
            '      <i class="fa fa-road fa-3x"></i>' +
            '      <br><span>导航，指引人生</span>' +
            '    </a>' +
            '  </div>' +
            '</div>';

        this.backdrop.addEventListener( 'click', Toolbox.prototype.hide.bind( this ), false);
        document.body.append( this.backdrop );

        // this.backdrop.querySelector( 'button' ).addEventListener( 'click', function (e) {
        //     alert( 'button' );
        //     e.stopPropagation();
        // }, false );

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
