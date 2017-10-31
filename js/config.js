define( function () {

    if (typeof Object.create !== "function") {
        Object.create = function (proto, propertiesObject) {
            if (!(proto === null || typeof proto === "object" || typeof proto === "function")) {
                throw TypeError('Argument must be an object, or null');
            }
            var temp = new Object();
            temp.__proto__ = proto;
            if(typeof propertiesObject ==="object")
                Object.defineProperties(temp,propertiesObject);
            return temp;
        };
    }


    function get( name ) {
        return window.localStorage.getItem( name );
    }

    function set( name, value ) {
        window.localStorage.setItem( name, value );
    }

    return  Object.create( Object.prototype, {

        userName: {
            writable: true,
            configurable: true,
            value: 'anonymous'
        },

        loginToken: {
            configurable: false,
            get: function () { return get( 'loginToken' ); },
            set: function ( value ) { set( 'loginToken', value ); }
        }

    } );

} );
