requirejs(['dexie', 'ol'], function(dexie, ol) {

    var globalMessage = document.getElementById('global-message');
    var showMessage = function (msg) {
        globalMessage.innerHTML = '<div class="alert alert-warning" role="alert">' +
            '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '<strong>Warning!</strong> ' + msg + '</div>';
        globalMessage.style.display = 'block';
    };

    var location = [-251.03894817,  34.22705742];
    var zoom = 8;
    var layer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    var map = new ol.Map({
        target: 'map',
        layers: [ layer ],
        view: new ol.View({
            center: ol.proj.fromLonLat(location),
            zoom: zoom
        })
    });

    layer.once('postcompose', function (e) {
        document.getElementById('splash').remove();
    });

    var navbar = document.getElementById('navbar');
    Array.prototype.forEach.call(navbar.getElementsByClassName('navbar-brand'), function (element) {
        element.addEventListener('click', function (e) {
            document.getElementById('dashboard').style.display = 'block';
            e.preventDefault();
        }, false);
    });

    var searchResults = document.createElement('UL');
    searchResults.className = 'list-group search-result-list';
    searchResults.style.display = 'none';
    searchResults.innerHTML = '<li class="list-group-item active">华清鱼汤</li>' +
        '<li class="list-group-item">西北大学新校区</li>' +
        '<li class="list-group-item">咸阳国际机场T2航站楼</li>';
    searchResults.addEventListener('mousedown', function (e) {
        searchResults.style.display = 'none';
        Array.prototype.forEach.call(
            searchResults.getElementsByClassName('list-group-item'),
            function (item) { item.className= 'list-group-item'; }
        );
        e.target.className += ' active';
    }, false);
    document.body.appendChild(searchResults);

    Array.prototype.forEach.call(navbar.getElementsByClassName('xs-search-form'), function (element) {
        element.addEventListener('mousedown', function (e) {
            if (document.hasFocus() && document.activeElement === e.target && searchResults.hasChildNodes() && searchResults.style.display === 'none') {
                searchResults.style.display = 'block';
                e.stopPropagation();
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

    var dashboard = document.getElementById('dashboard');
    dashboard.firstElementChild.nextElementSibling.addEventListener('mousedown', function (e) {
        if (e.target.tagName === 'A') {
            var li = e.target.parentElement;
            if (li.className !== 'active') {
                Array.prototype.forEach.call(li.parentElement.querySelectorAll('ul > li'), function (item) {
                    item.className = '';
                    var tabname = item.getAttribute('tab-name');
                    dashboard.lastElementChild.querySelector(tabname).className = 'tab-pane';
                });
                li.className = 'active';
                var tabname = li.getAttribute('tab-name');
                dashboard.lastElementChild.querySelector(tabname).className += ' active';
            }
            e.stopPropagation();
            e.preventDefault();
        }
    }, false);

    document.addEventListener('mousedown', function (e) {
        searchResults.style.display = 'none';
        dashboard.style.display = 'none';
        document.getElementById('global-message').style.display = 'none';
    }, false);
});
