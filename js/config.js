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

        version: {
            writable: false,
            value: [ 0, 1, 0 ]
        },

        userId: {
            configurable: false,
            get: function () { return get( 'userId' ); },
            set: function ( value ) { set( 'userId', value ); }
        },

        userName: {
            configurable: false,
            get: function () { return get( 'userName' ); },
            set: function ( value ) { set( 'userName', value ); }
        },

        loginToken: {
            configurable: false,
            get: function () { return get( 'loginToken' ); },
            set: function ( value ) { set( 'loginToken', value ); }
        },

        mapCenter: {
            configurable: false,
            get: function () { return get( 'mapCenter' ).split( ',' ).map( parseFloat ); },
            set: function ( value ) { set( 'mapCenter', value ); }
        },

        mapResolution: {
            configurable: false,
            get: function () { return parseFloat( get( 'mapResolution' ) ); },
            set: function ( value ) { set( 'mapResolution', value ); }
        },

        mapRotation: {
            configurable: false,
            get: function () { return parseFloat( get( 'mapRotation' ) ); },
            set: function ( value ) { set( 'mapRotation', value ); }
        },

        clusterDistance: {
            configurable: false,
            value: 20
        }

    } );

} );
