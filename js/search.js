define( [ 'db', 'state', 'utils' ], function ( db, state, utils ) {

    var _searchResults = document.createElement('UL');
    _searchResults.className = 'list-group search-result-list';
    _searchResults.style.display = 'none';
    _searchResults.addEventListener( 'click', function ( e ) {
        _searchResults.style.display = 'none';
        Array.prototype.forEach.call( _searchResults.getElementsByClassName( 'list-group-item' ), function ( item ) {
            item.className= 'list-group-item';
        } );
        e.target.className += ' active';
    }, false);
    document.getElementById( 'navbar' ).appendChild( _searchResults );

    var html = window.localStorage.getItem('searchResults');
    _searchResults.innerHTML = html === null ? '' : html;
    //     '<li class="list-group-item active">华清鱼汤</li>' +
    //     '<li class="list-group-item">西北大学新校区</li>' +
    //     '<li class="list-group-item">咸阳国际机场T2航站楼</li>';

    Array.prototype.forEach.call( navbar.getElementsByClassName('xs-search-form'), function ( element ) {
        element.addEventListener( 'click', function ( e ) {
            if ( _searchResults.hasChildNodes() ) {
                _searchResults.style.display = 'block';
            }
        }, false );
        element.addEventListener( 'submit', function ( e ) {
            e.preventDefault();
            _searchResults.style.display = 'none';
            var input = e.target.firstElementChild;
            var text = input.value;
            input.blur();
            if ( text )
                db.query( searchFeatures, text );
        }, false );
    } );

    var searchFeatures = function ( results ) {

        var n = results.length;
        var items = [];
        if ( n ) {
            results.forEach( function ( item ) {
                items.push( '<li class="list-group-item">' + item.title + '</li>' );
            } );
        }
        else
            utils.info( '没有找到任何结果' );

        _searchResults.innerHTML = items.join( '' )
;
        if ( n > 1 )
            _searchResults.style.display = 'block';

    };

    document.addEventListener( 'click', function ( e ) {

        var target = e.target;
        if ( ! ( target.tagName === 'INPUT' && target.name === 'search' ) )
             _searchResults.style.display = 'none';

    }, false);

    return {};

});
