define( [], function () {

    function itemHTML( id, title, url, icon, action, description ) {
        return '' +
            '<div class="app-item">' +
            '  <div class="thumbnail" data-id="' + id + '">' +
            '    <img src="' + url + '" alt="' + title + '">' +
            '    <div class="app-caption">' +
            '      <button name="take-photo" type="button" class="btn btn-success btn-sm pull-right">' +
            '        <i class="fa fa-' + icon + '"></i> ' + action + '</button>' +
            '      <p><strong>' + title + '</strong></p>' +
            '      <p>' + description + '</p>' +
            '    </div>' +
            '  </div>' +
            '  <!-- <div class="dx-actionbar" style="visibility: hidden;">' +
            '    <button name="uncheck" type="button" class="btn"><i class="fa fa-check-square fa-lg"></i></button>' +
            '    <button name="remove" type="button" class="btn"><i class="fa fa-minus-circle fa-lg"></i></button>' +
            '  </div> -->' +
            '</div>';
    }

    function Appbox() {

        this.backdrop = document.createElement( 'DIV' );
        this.backdrop.className = 'dx-modal dx-fullscreen';
        this.backdrop.style.visibility = 'hidden';

        var items = [];
        // overview.items.forEach( function ( item ) {
        //     items.push( itemHTML( item.id, item.title, item.preview ) );
        // } );
        items.push( itemHTML( 'app-life', '人生史记', 'images/record.jpg', 'camera', '拍照', '用一张地图，记录下你的人生故事' ) );
        items.push( itemHTML( 'app-house', '坐看天下', 'images/house.jpg', 'video-camera', '直播', '远程观景，直播看房，世界尽在你眼前' ) );
        items.push( itemHTML( 'app-travel', '室内导航', 'images/travel.jpg', 'road', '导航', '在机场车站，超市博物馆，为你指引方向' ) );
        items.push( itemHTML( 'app-travel', '先知预言', 'images/oracle.jpg', 'binoculars', '预言', '写下对未来的预测，彰显你的人生智慧' ) );

        // 无论你在那里
        this.backdrop.innerHTML =
            '<div class="toolbar">' +
            '  <button type="button" class="btn btn-default" id="close-thumbnail"><i class="fa fa-close"></i></button>' +
            '  <button type="button" class="btn btn-default hidden" id="trash-thumbnail"><i class="fa fa-trash-o fa-lg"></i></button>' +
            '</div>' +
            '<div class="appbox-content">' + items.join('') + '</div>';

        this.backdrop.addEventListener( 'click', Appbox.prototype.hide.bind( this ), false);
        document.body.appendChild( this.backdrop );

        this.backdrop.querySelector( '#close-thumbnail' ).addEventListener( 'click', Appbox.prototype.hide.bind( this ), false );
        this.backdrop.querySelector( '#trash-thumbnail' ).addEventListener( 'click', Appbox.prototype.trash.bind( this ), false );

        Array.prototype.forEach.call( this.backdrop.querySelectorAll( 'a.thumbnail' ), function ( element ) {
            element.addEventListener( 'click', this.handler, false );
        }.bind( this ) );

    }

    Appbox.prototype.show = function () {
        this.backdrop.style.visibility = 'visible';
    };

    Appbox.prototype.hide = function () {
        this.backdrop.style.visibility = 'hidden';
        this.destroy();
    };

    Appbox.prototype.destroy = function () {
        this.backdrop.remove();
    };

    Appbox.prototype.trash = function () {
        // 删除选中的所有 Item
    };

    Appbox.prototype.handler = function ( event ) {

        // 如果没有选中，那么选中，显示对应的 toolbar，并绑定对应的工具栏事件
        this.selectItem();

        // 如果已经选中，那么切换旋转木马切换到当前项目
        this.showcase.showItem();
        this.hide();

    };

    Appbox.prototype.selectItem = function ( item ) {
        item.querySelector( 'dx-actionbar' ).style.visibility = 'visible';
        item.querySelector( 'dx-actionbar button[name="uncheck"]' ).addEventHandler( 'click', this.handleUncheck, false );
        item.querySelector( 'dx-actionbar button[name="remove"]' ).addEventHandler( 'click', this.handleRemove, false );
    };

    Appbox.prototype.unselectItem = function ( item ) {
        item.querySelector( 'dx-actionbar' ).style.visibility = 'hidden';
        item.querySelector( 'dx-actionbar button[name="uncheck"]' ).removeEventHandler( 'click', this.handleUncheck, false );
        item.querySelector( 'dx-actionbar button[name="remove"]' ).removeEventHandler( 'click', this.handleRemove, false );
    };

    Appbox.prototype.removeItem = function ( item ) {
        this.showcase.removeItem();
        item.remove();
    };

    Appbox.prototype.handleRemove = function () {
        this.showcase.removeItem();
    };

    Appbox.prototype.handleUncheck = function () {
        var item;
        this.unselectItem( item );
    };

    return Appbox;

});
