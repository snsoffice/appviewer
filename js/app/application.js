define( [ 'ifuture', 'config', 'restapi', 'logger'
          'user', 'finder', 'house',
          'app/loader', 'app/communicator' ],

function( ifuture, config, restapi, logger,
          User, Finder, House,
          Loader, Communicator ) {

    var HOUSE_URL = 'houseUrl';
    var HOUSE_TOKEN = 'houseToken';
    var configFromURL = function () {

        var url;
        if (window.location.hash.length > 0) {
            // Prefered method since parameters aren't sent to server
            url = [window.location.hash.slice(1)];
        } else {
            url = decodeURI(window.location.href).split('?');
            url.shift();
        }
        if (url.length < 1) {
            return {};
        }
        url = url[0].split('&');

        var options = {};
        for (var i = 0; i < url.length; i++) {
            var name = url[i].split('=')[0];
            var value = url[i].split('=')[1];
            switch(name) {
                // configFromURL[ name ] = decodeURIComponent(value);
                // configFromURL[ name ] = Number(value);
                // configFromURL[ name ] = JSON.parse(value);
            case HOUSE_URL: case HOUSE_TOKEN:
                options[ name ] = decodeURIComponent(value);
                break;
            default:
                console.log('An invalid configuration parameter was specified: ' + name);
                break;
            }
        }
        return options;

    };


    Application = function ( opt_options ) {
        ifuture.Component.call( this );

        this.user = new User( this, opt_options );
        this.finder = new Finder( this, opt_options );
        this.house = new House( this, opt_options );
        this.loader = new Loader( this, opt_options );
        this.communicator = new Communicator( this, opt_options );

        this.bindEvent();
        this.user.bindEvent();
        this.finder.bindEvent();
        this.house.bindEvent();
        this.loader.bindEvent();
        this.communicator.bindEvent();
    };
    ifuture.inherits( Application, ifuture.Component );


    /**
     *
     * 启动应用程序
     *
     * @api
     */    
    Application.prototype.run = function () {
        var options = configFromURL();
    };

    /**
     *
     * 绑定需要处理的所有事件
     *
     * @api
     */    
    Application.prototype.bindEvent = function () {

        // window.addEventListener('unload', this.handleUnload.bind( this ), false);
        // window.addEventListener( 'online', this.handleOnline.bind( this ), false );
        // window.addEventListener( 'offline', this.handleOffline.bind( this ), false );

        this.on( '', this.handle

    };

    // $( document ).ready( function () {
    //     document.getElementById( 'loader' ).style.display = 'none';
    //     document.querySelector( '.dx-splash' ).style.display = 'none';
    //     document.querySelector( '.dx-finder' ).style.display = 'block';
    // } );

    return Application;

} );
