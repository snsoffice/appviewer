define( [ 'dxmap', 'dashboard', 'search', 'utils', 'carousel' ], function( dxmap, dashboard, search, utils, carousel ) {

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
            e.currentTarget.firstElementChild.className = 'fa fa-angle-double-left';
        }
        else {
            element.style.visibility = 'visible';
            e.currentTarget.firstElementChild.className = 'fa fa-angle-double-right';
        }
    } );

    document.getElementById( 'showcase' ).addEventListener( 'dblclick', function ( e ) {
        var element = e.currentTarget;
        element.className = ( element.className === 'dx-mini') ? 'dx-fullscreen' : 'dx-mini';
    } );

    document.getElementById( 'toggle-showcase' ).addEventListener( 'click', function ( e ) {
        var element = document.getElementById( 'showcase' );
        var mini = ( element.className === 'dx-mini' );
        e.currentTarget.firstElementChild.className =  mini ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        element.className = mini ? 'dx-fullscreen' : 'dx-mini';
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    } );

} );
