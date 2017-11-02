define( [ 'three' ], function ( THREE ) {

    // Class
    function Overview(path, description) {
        this.path = path;
        this.description = description; 
    }

    Overview.prototype.save = function () {
        return db.folders.put(this);
    }

    function webglAvailable () {
        try {
            var canvas = document.createElement( 'canvas' );
            return !!( window.WebGLRenderingContext && (
                canvas.getContext( 'webgl' ) ||
                    canvas.getContext( 'experimental-webgl' ) )
                     );
        } catch ( e ) {
            return false;
        }
    }

    var canvas = document.createElement( 'CANVAS' );
    var renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true, antialias: true } );
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    var canvas = _map.getTargetElement().querySelector( 'canvas' );
    var geometry = new THREE.BoxGeometry( 100, 100, 100 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
    camera.position.z = 10;

    var canvasFunction = function( extent, resolution, pixelRatio, size, projection ) {
        var canvasWidth = size[ 0 ];
        var canvasHeight = size[ 1 ];
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        renderer.setSize( size[0], size[1] );
        renderer.render( scene, camera );
        // renderer.renderBufferDirect( camera, null, null, material, null, cube );
        return canvas;
    };

    var layer3d = new ol.layer.Image({
          source: new ol.source.ImageCanvas({
            canvasFunction: canvasFunction,
            projection: 'EPSG:3857'
          })
        });
    // _map.addLayer( layer3d );

    return Overview;

});
