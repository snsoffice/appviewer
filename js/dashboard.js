define( [ 'utils' ], function ( utils ) {

    var dashboard = document.getElementById( 'dashboard' );

    dashboard.firstElementChild.nextElementSibling.addEventListener( 'click', function ( e ) {
        e.preventDefault();
        if ( e.target.tagName === 'A' ) {
            var li = e.target.parentElement;
            if ( li.className !== 'active' ) {
                Array.prototype.forEach.call( li.parentElement.querySelectorAll( 'ul > li' ), function ( item ) {
                    item.className = '';
                    var tabname = item.getAttribute( 'tab-name' );
                    dashboard.lastElementChild.querySelector( tabname ).className = 'tab-pane';
                } );
                li.className = 'active';
                var tabname = li.getAttribute( 'tab-name' );
                dashboard.lastElementChild.querySelector( tabname ).className += ' active';
            }
        }
    }, false );

    function Dashboard(path, description) {
        this.path = path;
        this.description = description;
    }

    Dashboard.prototype.save = function () {
        return db.folders.put(this);
    }

    // dashboard.firstElementChild.nextElementSibling.addEventListener('click', function (e) {
    //     
    // });

    // document.getElementById('login').addEventListener('mousedown', function (e) {
    //     var request = new XMLHttpRequest();
    //     request.onerror = function ( event ) {
    //         alert( 'Error: ' + event.toString() );
    //     };

    //     request.onloadend = function() {

    //         if (request.status != 200) {
    //             alert( 'status is not 200, but ' + request.status);
    //             return;
    //         }

    //         alert ( 'Got response: ' + request.responseText);
    //     };
    //     var url = 'http://snsoffice.com:9098/house/applogin';
    //     request.open('GET', url, true);        
    //     request.send();
    //     e.stopPropagation();
    // }, false);

    // document.addEventListener('look', function (e) {
    //     console.log('look'); 
    // }, false);
    // var evt = new Event("look", {"bubbles": false, "cancelable": false});
    // document.dispatchEvent(evt);


    document.addEventListener( 'click', function ( e ) {

        var tag = e.target.tagName;
        if ( ( ! ( tag === 'BUTTON' || tag === 'A' ) ) || ( e.target.className === 'close' ) )
            dashboard.style.display = 'none';

    }, false);


    return Dashboard;

});
