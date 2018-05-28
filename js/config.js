define( function () {

    function get( name ) {
        return window.localStorage.getItem( name );
    }

    function set( name, value ) {
        window.localStorage.setItem( name, value );
    }

    return Object.create( Object.prototype, {

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

        houseScope: {
            configurable: false,
            get: function () { return get( 'houseScope' ); },
            set: function ( value ) { set( 'houseScope', value ); }
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
        },

        resourceBaseUrl: {
            configurable: false,
            value: "http://owtayt1td.bkt.clouddn.com"
        },

    } );

} );
