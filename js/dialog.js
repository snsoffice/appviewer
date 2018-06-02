define( [ 'jquery', 'db' ], function ( $, db ) {

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

    Dialog.prototype.show = function ( callback ) {

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

    Dialog.prototype.login = function ( callback ) {
        var html =
            '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-centered" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h3 class="modal-title">登录</h3>' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '      </div>' +
            '      <form class="modal-body">' +
            '        <div class="form-group">' +
            '          <label for="inputEmail" class="sr-only">Email address</label>' +
            '          <input type="text" id="inputEmail" class="form-control" placeholder="用户名称" required autofocus>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <label for="inputPassword" class="sr-only">Password</label>' +
            '          <input type="password" id="inputPassword" class="form-control" placeholder="密码" required>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <div class="checkbox mb-3">' +
            '            <label>' +
            '              <input type="checkbox" value="remember-me"> 记住本次登录用户' +
            '            </label>' +
            '          </div>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <button class="btn btn-lg btn-primary btn-block" type="button"> 登 录 </button>' +
            '          <p class="mt-5 mb-3 text-muted text-center">远景网 &copy; 2018</p>' +
            '        </div>' +
            '      </form>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        var element = document.createElement( 'DIV' );
        element.innerHTML = html;
        var dialog = element.firstElementChild;
        document.body.appendChild( dialog );

        dialog.querySelector( 'button.btn-primary' ).addEventListener( 'click', function ( e ) {
            var form = dialog.querySelector( 'form.modal-body' );
            if ( form.checkValidity() ) {
                $( dialog ).modal( 'hide' );
                callback( dialog.querySelector( '#inputEmail' ).value, dialog.querySelector( '#inputPassword' ).value );
            }
        }, false );

        $( dialog ).modal( 'show' );
    };

    Dialog.prototype.signup = function ( callback ) {
        var html =
            '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog modal-dialog-centered" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h3 class="modal-title"> 新用户注册 </h3>' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '      </div>' +
            '      <form class="modal-body">' +
            '        <div class="form-group">' +
            '          <label for="inputLogin" class="sr-only">User login name</label>' +
            '          <input type="text" id="inputLogin" class="form-control" placeholder="登录名称" required autofocus>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <label for="inputEmail" class="sr-only">Email address</label>' +
            '          <input type="email" id="inputEmail" class="form-control" placeholder="电子邮件" required>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <label for="inputUsername" class="sr-only">User fullname</label>' +
            '          <input type="text" id="inputUsername" class="form-control" placeholder="用户名称" required>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <label for="inputPassword" class="sr-only">Password</label>' +
            '          <input type="password" id="inputPassword" class="form-control" placeholder="密码" required>' +
            '        </div>' +
            '        <div class="form-group">' +
            '          <button class="btn btn-lg btn-primary btn-block" type="button"> 注册 </button>' +
            '          <p class="mt-5 mb-3 text-muted text-center">远景网 &copy; 2018</p>' +
            '        </div>' +
            '      </form>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        var element = document.createElement( 'DIV' );
        element.innerHTML = html;
        var dialog = element.firstElementChild;
        document.body.appendChild( dialog );

        dialog.querySelector( 'button.btn-primary' ).addEventListener( 'click', function ( e ) {
            var form = dialog.querySelector( 'form.modal-body' );
            if ( form.checkValidity() ) {
                $( dialog ).modal( 'hide' );
            }
        }, false );

        $( dialog ).modal( 'show' );
    };

    Dialog.prototype.selectDomain = function ( callback ) {
        var html = [
            '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <h5 class="modal-title">选择空间</h5>' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '      </div>' +
            '      <div class="modal-body">' +
            '        <ul class="list-group list-group-flush text-center">'
        ];

        var domains = [
            {
                userid: '',
                title: '公众空间'
            },
        ];
        var selected = 0;
        for( var i = 0; i < domains.length; i ++ ) {
            if (i === selected)
                html.push( '<li class="list-group-item bg-info" data-domain="' + domains[ i ].userid + '">' + domains[ i ].title +
                           ' <span class="float-right text-secondary" data-favorite="true"><i class="fas fa-heart"></i></span>' +
                           '</li>' );
            else
                html.push( '<li class="list-group-item" data-favorite="true" data-domain="' + domains[ i ].userid + '">' + domains[ i ].title +
                           ' <span class="float-right text-secondary" data-favorite="true"><i class="fas fa-heart"></i></span>' +
                           '</li>' );
        }

        html.push(
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        var element = document.createElement( 'DIV' );
        element.innerHTML = html.join( '' );
        var dialog = element.firstElementChild;
        document.body.appendChild( dialog );

        dialog.querySelector( '.modal-body > ul' ).addEventListener( 'click', function ( e ) {
            var ul = e.currentTarget;
            if ( e.target.tagName === 'LI' ) {
                for (var i = 0; i < ul.children.length; i++) {
                    ul.children[i].className = 'list-group-item';
                }
                e.target.className = 'list-group-item bg-info';

                if ( typeof callback === 'function' )
                    callback( e.target.getAttribute( 'data-doamin' ) );

                $( dialog ).modal( 'hide' );
            }

            else {
                var span = e.target.parentElement;
                if ( span.tagName !== 'SPAN' )
                    span = span.parentElement;
                var flag = span.getAttribute( 'data-favorite' );
                if ( flag === 'true' ) {
                    span.setAttribute( 'data-favorite', 'false' );
                    span.innerHTML = '<i class="far fa-heart"></i>';
                }
                else if ( flag === 'false' ) {
                    span.setAttribute( 'data-favorite', 'true' );
                    span.innerHTML = '<i class="fas fa-heart"></i>';
                }
            }

            return true;
        }, false );

        $( dialog ).modal( 'show' );
    };

    Dialog.prototype.settings = function ( callback ) {
        var html = [
            '<div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">' +
            '  <div class="modal-dialog" role="document">' +
            '    <div class="modal-content">' +
            '      <div class="modal-header">' +
            '        <nav class="navbar navbar-light bg-light">' +
            '          <span class="navbar-brand mb-0 h1">设置</span>' +
            '          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" ' +
            '                  aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">' +
            '            <span class="navbar-toggler-icon"></span>' +
            '          </button>' +
            '          <div class="collapse navbar-collapse" id="navbarNavAltMarkup">' +
            '            <div class="navbar-nav">' +
            '              <a class="nav-item nav-link active" href="#">个人信息 <span class="sr-only">(current)</span></a>' +
            '              <a class="nav-item nav-link" href="#">地图显示</a>' +
            '              <a class="nav-item nav-link" href="#">其他设置</a>' +
            '              <a class="nav-item nav-link disabled" href="#">实名认证</a>' +
            '            </div>' +
            '          </div>' +
            '        </nav>' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '          <span aria-hidden="true">&times;</span>' +
            '        </button>' +
            '      </div>' +
            '      <div class="modal-body">'
        ];

        html.push(
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            document.body.removeChild( dialog );
        } );

        var element = document.createElement( 'DIV' );
        element.innerHTML = html.join( '' );
        var dialog = element.firstElementChild;
        document.body.appendChild( dialog );

        dialog.querySelector( '.modal-body' ).addEventListener( 'click', function ( e ) {
        }, false );

        $( dialog ).modal( 'show' );
    };

    return Dialog;

} );
