define( [], function () {

    function Thumbnail( options ) {
        
        this.backdrop = document.createElement( 'div' );
        this.backdrop.className = 'dx-thumbnail dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        this.backdrop.innerHTML = 
            '<div class="toolbar">' +
            '  <button type="button" class="btn btn-default" id="close-thumbnail"><i class="fa fa-close"></i></button>' +
            '  <button type="button" class="btn btn-default" id="trash-thumbnail"><i class="fa fa-trash-o fa-lg"></i></button>' +
            '</div>' +
            '<div class="container-fluid">' +
            '  <div class="row">' +
            '    <div class="col-xs-6 col-md-3">' +
            '      <a href="#" class="thumbnail">' +
            '        <img src="data/html/images/cup.jpg" alt="九龙杯">' +
            '      </a>' +
            '      <div class="dx-actionbar">' +
            '        <button type="button" class="btn"><i class="fa fa-check-square fa-lg"></i></button>' +
            '        <button type="button" class="btn"><i class="fa fa-minus-circle fa-lg"></i></button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        this.backdrop.addEventListener( 'click', Thumbnail.prototype.hide.bind( this ), false);
        document.body.appendChild( this.backdrop );

        // var handler = function ( e ) {
        //     document.dispatchEvent( new Event( e.currentTarget.getAttribute( 'data-trigger' ) ) );
        // };
        // Array.prototype.forEach.call( this.backdrop.querySelectorAll( 'a' ), function ( element ) {
        //     element.addEventListener( 'click', handler );
        // } );

    }

    Thumbnail.prototype.show = function () {
        this.backdrop.style.visibility = 'visible';
    }

    Thumbnail.prototype.hide = function () {
        this.backdrop.style.visibility = 'hidden';
        this.destroy();
    }

    Thumbnail.prototype.destroy = function () {
        this.backdrop.remove();
    }

    return Thumbnail;

});
