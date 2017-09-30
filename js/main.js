define( [ 'dxmap', 'dashboard', 'search', 'utils' ], function( dxmap, dashboard, search, utils ) {

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

    document.getElementById( 'toggle-overview' ).addEventListener( 'click', function ( e ) {
        var element = document.getElementById( 'overview' );
        var visible = element.style.visibility === 'visible';
        if ( visible ) {
            element.style.visibility = 'hidden';
            e.target.firstElementChild.className = 'fa fa-angle-double-left';
        }
        else {
            element.style.visibility = 'visible';
            e.target.firstElementChild.className = 'fa fa-angle-double-right';
        }
    } );


} );
