define( [ 'carousel', 'thumbnail', 'panorama', 'video5' ],
function ( Carousel, Thumbnail, Panorama, Video5 ) {

    function createParkLayer() {
        // 创建一个图层，Image, 使用俯视图

        // 创建一个图层，Vector

        // 返回两个图层

        // 添加两个图层到大地图

        // 添加俯视图到小地图

        
    }


    function toggleShowcase() {
        var element = document.getElementById( 'showcase' );
        var mini = ( element.className === 'dx-mini' );
        e.currentTarget.firstElementChild.className =  mini ? 'fa fa-chevron-down' : 'fa fa-chevron-up';
        element.className = mini ? 'dx-fullscreen' : 'dx-mini';
        document.dispatchEvent( new Event( 'toggle-showcase' ) );
    }

    function hideShowcase() {
        var element = document.getElementById( 'showcase' );
        element.style.visibility = 'hidden';
        document.dispatchEvent( new Event( 'hide-showcase' ) );
    }

    document.getElementById( 'showcase' ).addEventListener( 'dblclick', toggleShowcase,  false );
    document.getElementById( 'toggle-showcase' ).addEventListener( 'click', toggleShowcase,  false );
    document.getElementById( 'remove-case' ).addEventListener( 'click', hideShowcase,  false );

    function Showcase( options ) {
        this.carousel_ = new Carousel();
    }

    
    Showcase.prototype.showThumbnail = function () {
        new Thumbnail( this.carousel_ ).show();
    }

    return Showcase;

});
