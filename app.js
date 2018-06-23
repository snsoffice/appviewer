//
// 浏览器要求
//
//  HTML5:                  https://html.spec.whatwg.org/multipage/
//  ECMAScript 5:           http://www.ecma-international.org/ecma-262/5.1/
//  CSS3:
//  ECMAScript 6 - promise: https://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects
//
// Polyfills
//
// es6 promise: https://www.udacity.com/course/javascript-promises--ud898

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

// polyfill String.startsWith()
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(search, pos) {
	return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };
}

// polyfill Object.create used in config.js
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

// 
// 调试模式，在手机上调试的时候，如果出现没有捕获的异常，直接在页面上显示
//
var debugMode = true;
var showDebugMessage = function ( msg ) {
    var element = document.querySelector( '.dx-error' );
    if ( ! element ) {
        element = document.createElement( 'DIV' );
        element.innerHTML = '<div class="p-3 bg-warning text-dark">' + msg + '</div>';
        element.className = 'dx-page dx-error';
        element.style.zIndex = 8096;
        document.body.appendChild( element );
        element.addEventListener( 'click', function ( e ) {
            e.stopPropagation();
            element.remove();
        }, false );
    }
    else {
        var div = document.createElement( 'DIV' );
        div.innerHTML = '<div class="p-3 bg-warning text-dark mt-3">' + msg + '</div>';
        element.appendChild( div );
    }
};

if ( debugMode ) {

    requirejs.onError = function ( err ) {
        var msg = '<p>RequireJS 异常：' +
            '<p>requireType:    ' + err.requireType +
            '<p>requireModules: ' + err.requireModules +
            '<p>' + err.stack;
        showDebugMessage( msg );
        throw err;
    };

    window.onerror = function ( message, source, lineno, colno, error ) { 
        var msg = '<p>没有捕获的异常:</p>' +
            '<p>message: ' + message +
            '<p>source:  ' + source +
            '<p>lineno:  ' + lineno +
            '<p>colno:   ' + colno +
            '<p' + error;
        showDebugMessage( msg );
    };  

}


requirejs( [ 'fontawesome', 'jquery', 'bootstrap', 'app/main' ] );
