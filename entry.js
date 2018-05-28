// 
// Polyfills
// 

// polyfill the remove() method in Internet Explorer 9 and iOS Safari
// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode !== null)
          this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

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


require.config( {

    baseUrl: 'js',

    paths: {
        jquery: 'lib/jquery-3.3.1.slim.min',
        popper: 'lib/popper.min',
        bootstrap: 'lib/bootstrap.min',
        fontawesome: 'lib/fontawesome-all.min',
        ol: 'lib/ol-v4.6.4/ol',
        easyrtc: 'lib/easyrtc',
        dexie: 'lib/dexie-1.5.1/dexie.min',
        three: 'lib/three.min',
        pannellum: 'lib/pannellum',
        libpannellum: 'lib/libpannellum',
        owl: 'lib/owl.carousel.min',
        videojs: 'lib/video.min',
        'socket.io': 'lib/socket.io.min',
    },

    // Fix timeout issue
    waitSeconds: 0,

} );

requirejs.onError = function ( err ) {
    console.log( err.requireType );
    if ( err.requireType === 'timeout' ) {
        console.log( 'modules: ' + err.requireModules );
    }
    throw err;
};

requirejs( [ 'fontawesome', 'jquery', 'bootstrap', 'main' ] );
