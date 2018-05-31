define( [ 'ifuture', 'jquery' ],

function( ifuture, $ ) {

    Navbar = function ( app, opt_options ) {

        ifuture.Component.call( this );

        var element = document.getElementById( 'navbar' );
        this.element = element;
        
        var searchinput = element.querySelector( '#searchbox > input' );
        var searchresult = [];

        element.querySelector( '#future-search' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            // searchinput.style.opacity = '0.6';
            // searchinput.focus();
        }, false );

        searchinput.addEventListener( 'blur', function ( e ) {
            // searchinput.style.opacity = '0';
            if ( searchresult.length ) {
                var html = [ '<ul class="list-group list-group-flush">' ];
                for ( var i = 0 ; i < searchresult.length; i ++ ) {
                    html.push( '<li class="list-group-item" index="' + i + '">' + searchresult[ i ] + '</li>' );
                }                
                html.push( '</ul>' );

                var popover = document.createElement( 'DIV' );
                popover.innerHTML = html.join('');

                popover.addEventListener( 'click', function ( e ) {

                    var target = e.target;
                    while ( target && target.tagName.toUpper() !== 'LI' ) {
                        target = target.parentElement;
                    }

                }, false );

                $( searchinput ).popover( {
                    content: popover,
                    html: true,
                    trigger: 'focus',
                    placement: 'auto',
                } ).popover( 'show' );
            }

        }, false );

        element.querySelector( '#future-domain' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            app.request( 'dialog', 'selectDomain');
        }, false );

        // element.querySelector( '#future-refresh' ).addEventListener( 'click', function ( e ) {
        //     e.preventDefault();
        //     app.request( 'manager', 'show', 'toolbox' );
        // }, false );

        // element.querySelector( '#future-menu' ).addEventListener( 'click', function ( e ) {
        //     e.preventDefault();
        //     app.request( 'manager', 'show', 'talk' );
        // }, false );

        // element.querySelector( '#show-manager' ).addEventListener( 'click', function ( e ) {
        //     e.preventDefault();
        //     app.request( 'manager', 'show' );
        // }, false );

    }
    ifuture.inherits( Navbar, ifuture.Component );

    return Navbar;

} );
