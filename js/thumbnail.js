define( [], function () {

    function itemHTML( index, url ) {
        return
            '<div class="col-xs-6 col-md-3">' +
            '  <a href="#" class="thumbnail" data-index="' + index.toString() + '">' +
            '    <img src="' + url + '" alt="">' +
            '  </a>' +
            '  <div class="dx-actionbar" style="visibility: hidden;">' +
            '    <button name="uncheck" type="button" class="btn"><i class="fa fa-check-square fa-lg"></i></button>' +
            '    <button name="remove" type="button" class="btn"><i class="fa fa-minus-circle fa-lg"></i></button>' +
            '  </div>' +
            '</div>';
    }


    function Thumbnail( showcase ) {

        this.showcase = showcase;
        this.backdrop = document.createElement( 'div' );
        this.backdrop.className = 'dx-thumbnail dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        var items = [];
        showcase.items.forEach( function ( item, index ) {
            items.push( itemHTML( index, item.url ) );
        } );
        this.backdrop.innerHTML =
            '<div class="toolbar">' +
            '  <button type="button" class="btn btn-default" id="close-thumbnail"><i class="fa fa-close"></i></button>' +
            '  <button type="button" class="btn btn-default" id="trash-thumbnail"><i class="fa fa-trash-o fa-lg"></i></button>' +
            '</div>' +
            '<div class="container-fluid">' + items.join('') + '</div>';

        this.backdrop.addEventListener( 'click', Thumbnail.prototype.hide.bind( this ), false);
        document.body.appendChild( this.backdrop );

        this.backdrop.getElementById( 'close-thumbnail' ).addEventListener( 'click', Thumbnail.prototype.hide.bind( this ), false );
        this.backdrop.getElementById( 'trash-thumbnail' ).addEventListener( 'click', Thumbnail.prototype.trash.bind( this ), false );

        // var handler = function ( e ) {
        //     document.dispatchEvent( new Event( e.currentTarget.getAttribute( 'data-trigger' ) ) );
        // };
        Array.prototype.forEach.call( this.backdrop.querySelectorAll( 'a.thumbnail' ), function ( a ) {
            a.addEventListener( 'click', this.handler, false );
        }.bind( this ) );

    }

    Thumbnail.prototype.show = function () {
        this.backdrop.style.visibility = 'visible';
    };

    Thumbnail.prototype.hide = function () {
        this.backdrop.style.visibility = 'hidden';
        this.destroy();
    };

    Thumbnail.prototype.destroy = function () {
        this.backdrop.remove();
    };

    Thumbnail.prototype.trash = function () {
        // 删除选中的所有 Item
    };

    Thumbnail.prototype.handler = function ( event ) {

        // 如果没有选中，那么选中，显示对应的 toolbar，并绑定对应的工具栏事件
        this.selectItem();

        // 如果已经选中，那么切换旋转木马切换到当前项目
        this.showcase.showItem();
        this.hide();

    };

    Thumbnail.prototype.selectItem = function ( item ) {
        item.querySelector( 'dx-actionbar' ).style.visibility = 'visible';
        item.querySelector( 'dx-actionbar button[name="uncheck"]' ).addEventHandler( 'click', this.handleUncheck, false );
        item.querySelector( 'dx-actionbar button[name="remove"]' ).addEventHandler( 'click', this.handleRemove, false );
    };

    Thumbnail.prototype.unselectItem = function ( item ) {
        item.querySelector( 'dx-actionbar' ).style.visibility = 'hidden';
        item.querySelector( 'dx-actionbar button[name="uncheck"]' ).removeEventHandler( 'click', this.handleUncheck, false );
        item.querySelector( 'dx-actionbar button[name="remove"]' ).removeEventHandler( 'click', this.handleRemove, false );
    };

    Thumbnail.prototype.removeItem = function ( item ) {
        this.showcase.removeItem();
        item.remove();
    };

    Thumbnail.prototype.handleRemove = function () {
        this.showcase.removeItem();
    };

    Thumbnail.prototype.handleUncheck = function () {
        var item;
        this.unselectItem( item );
    };

    return Thumbnail;

});
