define( [], function () {

    function itemHTML( id, title, url ) {
        return '' +
            '<div class="showcase-item col-xs-6 col-md-3">' +
            '  <div class="thumbnail" data-id="' + id + '">' +
            '    <img src="' + url + '" alt="' + title + '">' +
            '    <div class="caption">' +
            '      <h3>' + title + '</h3>' +
            '    </div>' +
            '  </div>' +
            '  <div class="dx-actionbar" style="visibility: hidden;">' +
            '    <button name="uncheck" type="button" class="btn"><i class="fa fa-check-square fa-lg"></i></button>' +
            '    <button name="remove" type="button" class="btn"><i class="fa fa-minus-circle fa-lg"></i></button>' +
            '  </div>' +
            '</div>';
    }

    function Thumbnail( overview ) {

        this.overview = overview;
        this.backdrop = document.createElement( 'DIV' );
        this.backdrop.className = 'dx-thumbnail dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        var items = [];
        // overview.items.forEach( function ( item ) {
        //     items.push( itemHTML( item.id, item.title, item.preview ) );
        // } );
        items.push( itemHTML( 'app-life', '人生史记', 'images/record.jpg' ) );
        items.push( itemHTML( 'app-house', '远程看房', 'images/house.jpg' ) );
        items.push( itemHTML( 'app-travel', '交通导航', 'images/travel.jpg' ) );

        this.backdrop.innerHTML =
            '<div class="toolbar">' +
            '  <button type="button" class="btn btn-default" id="close-thumbnail"><i class="fa fa-close"></i></button>' +
            '  <button type="button" class="btn btn-default" id="trash-thumbnail"><i class="fa fa-trash-o fa-lg"></i></button>' +
            '</div>' +
            '<div class="container-fluid">' + items.join('') + '</div>';

        this.backdrop.addEventListener( 'click', Thumbnail.prototype.hide.bind( this ), false);
        document.body.appendChild( this.backdrop );

        this.backdrop.querySelector( '#close-thumbnail' ).addEventListener( 'click', Thumbnail.prototype.hide.bind( this ), false );
        this.backdrop.querySelector( '#trash-thumbnail' ).addEventListener( 'click', Thumbnail.prototype.trash.bind( this ), false );

        Array.prototype.forEach.call( this.backdrop.querySelectorAll( 'a.thumbnail' ), function ( element ) {
            element.addEventListener( 'click', this.handler, false );
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

        event.stopPropagation();

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
