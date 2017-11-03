define(['jquery'], function($) {

    Dialog = function ( app, opt_options ) {
        this.element = null;
    }

    Dialog.prototype.create = function () {
        var element = document.createElement( 'DIV' );
        element.className = 'dx-dialog';
        element.innerHTML =
            '<div class="panel panel-default">' +
            '  <div class="panel-heading">' +
            '    <h3 class="panel-title">呼叫</h3>' +
            '  </div>' +
            '  <div class="panel-body">' +
            '<form>' +
            '  <div class="form-group">' +
            '    <label for="exampleInputEmail1">Email address</label>' +
            '    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Email">' +
            '  </div>' +
            '  <div class="form-group">' +
            '    <label for="exampleInputPassword1">Password</label>' +
            '    <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">' +
            '  </div>' +
            '  <div class="form-group">' +
            '    <label for="exampleInputFile">File input</label>' +
            '    <input type="file" id="exampleInputFile">' +
            '    <p class="help-block">Example block-level help text here.</p>' +
            '  </div>' +
            '  <div class="checkbox">' +
            '    <label>' +
            '      <input type="checkbox"> Check me out' +
            '    </label>' +
            '  </div>' +
            '</form>' +
            '  </div>' +
            '  <div class="panel-footer">' +
            '    <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>' +
            '    <button type="button" class="btn btn-success pull-right">确定</button>' +
            '  </div>' +
            '</div>';
        this.element = element;
    };

    Dialog.prototype.show = function ( callback, cancelCallback ) {
        var scope = this;
        var backdrop = document.createElement( 'DIV' );
        backdrop.className = 'modal-backdrop in';
        document.body.appendChild( backdrop );
        document.body.appendChild( this.element );
        this.element.addEventListener( 'click', function ( e ) {
            backdrop.remove();
            scope.element.remove();
        } );
    };

    return Dialog;

} );
