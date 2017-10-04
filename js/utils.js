define( function () {

    //
    // Message box
    //
    var _elementMessage = document.getElementById( 'message' );
    var _showMessage = function ( msg, className ) {
        _elementMessage.innerHTML = '<div class="alert alert-' + className + '" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            msg + '</div>';
        _elementMessage.style.display = 'block';
    };

    document.addEventListener( 'click', function ( e ) {
        _elementMessage.style.display = 'none';
    }, false );


    //
    // Map Visualization
    //
    function _createVisualization( angle, distance ) {
        var angle = ( angle === undefined ? 45 : angle ) / 180 * Math.PI;
        var distance = distance === undefined ? 100 : distance;
        var color = '#ff1493';
        var opacity = 0.20;

        var canvas = document.createElement( 'CANVAS' );
        var ctx = canvas.getContext('2d');

        var t = Math.tan( angle / 2.0 );
        var x = parseInt( distance * t ), y = 0;
        var xm = x, ym = parseInt( distance * 1.1 );
        var x1 = 0, y1 = - distance;
        var x2 = x + x, y2 = - distance;
        var sx = 2.381, sy = 0.81;

        canvas.width = x2 * sx;
        canvas.height = ym * sy;

        ctx.save();
        ctx.fillStyle = color;
        ctx.scale( sx, sy );
        ctx.translate( 0,  ym );

        ctx.moveTo( x, y );
        ctx.quadraticCurveTo( x1, y1, xm, - ym );
        ctx.quadraticCurveTo( x2, y2, x, y );

        ctx.fill();
        ctx.restore();

        return canvas.toDataURL();
    }

    return {

        warning: function ( msg ) {
            _showMessage( msg, 'warning' );
        },

        info: function ( msg ) {
            _showMessage( msg, 'info' );
        },

        createVisualization: _createVisualization,
     
    }

} );
