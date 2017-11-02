define( [ 'state' ], function ( state ) {

    function User() {
        this.name = window.localStorage.getItem('userName');
        this.uuid = window.localStorage.getItem('userUuid');
        this.token = window.localStorage.getItem('loginToken');
    }

    User.prototype.login = function ( name, password ) {

        function onLogin ( name, uuid, token ) {
            this.name = name;
            this.uuid = uuid;
            this.token = token;
            document.dispatchEvent( new Event( 'login', { user: this } ) );
        }
            
        if ( typeof name === 'string' ) {
            
        }

        else if ( ! this.name ) {
            
        }
        
    };

    User.prototype.getToken = function () {

        return token === null ? '' : token;

    };

    var _user = new User();

    if ( state.online )
        _user.login();

    return _user;

} );
