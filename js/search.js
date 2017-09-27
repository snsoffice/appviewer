requirejs( [ 'utils' ], function ( utils ) {

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
    document.body.appendChild( _searchResults );

    _searchResults.innerHTML = '<li class="list-group-item active">华清鱼汤</li>' +
        '<li class="list-group-item">西北大学新校区</li>' +
        '<li class="list-group-item">咸阳国际机场T2航站楼</li>';
    

    Array.prototype.forEach.call( navbar.getElementsByClassName('xs-search-form'), function ( element ) {
        element.addEventListener( 'click', function ( e ) {
            if ( _searchResults.hasChildNodes() ) {
                _searchResults.style.display = 'block';
            }
        }, false);
    });

    var searchFeatures = function (name) {
        // Array.prototype.forEach.call(
        //     searchResults.getElementsByClassName('list-group-item'),
        //     function (item) { item.remove(); }
        // );
        // searchResults.innerHTML = '';
    };

    document.addEventListener( 'click', function ( e ) {

        var target = e.target;
        if ( ! ( target.tagName === 'INPUT' && target.name === 'search' ) )
             _searchResults.style.display = 'none';

    }, false);

    return {};

});
