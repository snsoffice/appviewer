define( function () {

    var _elementMessage = document.getElementById( 'global-message' );
    var _showMessage = function ( msg, className ) {
        _elementMessage.innerHTML = '<div class="alert alert-' + className + '" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            msg + '</div>';
        _elementMessage.style.display = 'block';
    };

    return {
        warning: function ( msg ) {
            _showMessage( msg, 'warning' );
        },

        info: function ( msg ) {
            _showMessage( msg, 'info' );
        }
    }

} );
