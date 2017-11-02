define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    Toolbox = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'toolbox';
        this.title = '功能';
    }
    ifuture.inherits( Toolbox, Toolcase );

    Toolbox.prototype.create = function () {
        var element = document.createElement( 'DIV' );
        div.className = 'dx-toolbox';
        element.innerHTML =
            '<div class="dx-tool">' +
            '  <a class="btn btn-lg btn-default" href="#" data-trigger="take-photo">' +
            '    <i class="fa fa-camera fa-1x"></i>' +
            '    <br><span>拍照，记录生活</span>' +
            '  </a>' +
            '</div>' +
            '<div class="dx-tool">' +
            '  <a class="btn btn-lg btn-default" href="#" data-trigger="take-broadcast">' +
            '    <i class="fa fa-video-camera fa-1x"></i>' +
            '    <br><span>直播，展示风采</span>' +
            '  </a>' +
            '</div>' +
            '<div class="dx-tool" style="display: block;">' +
            '  <a class="btn btn-lg btn-default" href="#" data-trigger="take-forecast">' +
            '    <i class="fa fa-binoculars fa-1x"></i>' +
            '    <br><span>预言，彰显智慧</span>' +
            '  </a>' +
            '</div>' +
            '<div class="dx-tool">' +
            '  <a class="btn btn-lg btn-default" href="#" data-trigger="take-navigation">' +
            '    <i class="fa fa-road fa-1x"></i>' +
            '    <br><span>导航，指引人生</span>' +
            '  </a>' +
            '</div>';

        // element.addEventListener( 'click', Toolbox.prototype.hide.bind( this ), false);
        return element;
    };

    return Toolbox;

} );
