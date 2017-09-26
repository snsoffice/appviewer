define( [ 'dxmap', 'dashboard', 'utils' ], function( dxmap, dashboard, utils ) {

    var navbar = document.getElementById( 'navbar' );

    Array.prototype.forEach.call( navbar.getElementsByClassName( 'navbar-brand' ), function ( element ) {
        element.addEventListener( 'click', function ( e ) {
            e.preventDefault();
            document.getElementById( 'dashboard' ).style.display = 'block';
        }, false );
    });

    document.addEventListener( 'click', function ( e ) {
        document.getElementById( 'global-message' ).style.display = 'none';
    }, false );

} );
