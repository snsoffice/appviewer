define( [ 'ifuture', 'jquery', 'db', 'config' ], function ( ifuture, $, db, config ) {

    var _ITEM_SELECTOR_TEMPLATE = '                                           \
        <div class="modal-dialog modal-dialog-centered" role="document">      \
          <div class="dx-item-selector">                                      \
            <div class="d-flex flex-row flex-wrap justify-content-center">    \
              %BUTTONS%                                                       \
            </div>                                                            \
          </div>                                                              \
        </div>';

    function createDialog( template ) {

        Array.prototype.forEach.call( document.querySelectorAll( '.dx-modal-container' ), function ( dialog ) {
            dialog.remove();
        } );

        // <div class="modal fade dx-modal-container" tabindex="-1" role="dialog" aria-hidden="true">
        var element = document.createElement( 'DIV' );
        element.className = 'modal fade dx-modal-container';
        element.setAttribute( 'tabindex', '-1' );
        element.setAttribute( 'role', 'dialog' );
        element.setAttribute( 'aria-hidden', 'true' );
        element.innerHTML = template;
        document.body.appendChild( element );

        return element

    }

    var login = function ( callback ) {
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
            '        <div class="form-group d-none">' +
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

    var signup = function ( callback ) {
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
            '          <label for="inputFullname" class="sr-only">User fullname</label>' +
            '          <input type="text" id="inputFullname" class="form-control" placeholder="用户名称" required>' +
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
                callback( dialog.querySelector( '#inputLogin' ).value,
                          dialog.querySelector( '#inputEmail' ).value,
                          dialog.querySelector( '#inputFullname' ).value,
                          dialog.querySelector( '#inputPassword' ).value
                        );

            }
        }, false );

        $( dialog ).modal( 'show' );
    };

    var info = function ( msg ) {

        var template = '                                                        \
            <div class="modal-dialog modal-dialog-centered" role="document">    \
              <div class="modal-content text-center py-2 bg-warning text-dark"> \
                %MESSAGE%                                                       \
              </div>                                                            \
            </div>';

        var dialog = createDialog( template.replace( '%MESSAGE%', msg ) );
        $( dialog ).modal( 'show' );

        $( '.modal-content', dialog ).on( 'click', function () {
            $( dialog ).modal( 'hide' );
        } );

    };

    var warning = function ( msg ) {

        var template = '                                                        \
            <div class="modal-dialog modal-dialog-centered" role="document">    \
              <div class="modal-content text-center py-2 bg-warning text-dark"> \
                %MESSAGE%                                                       \
              </div>                                                            \
            </div>';

        var dialog = createDialog( template.replace( '%MESSAGE%', msg ) );
        $( dialog ).modal( 'show' );

        $( '.modal-content', dialog ).on( 'click', function () {
            $( dialog ).modal( 'hide' );
        } );

    };

    var askfor = function ( msg ) {

        var template = '                                                     \
            <div class="modal-dialog modal-dialog-centered" role="document"> \
              <div class="modal-content text-center py-2 bg-warning">        \
                %MESSAGE%                                                    \
              </div>                                                         \
            </div>';

        var dialog = createDialog( template.replace( '%MESSAGE%', msg ) );
        $( dialog ).modal( 'show' );

    };

    var acceptor = function ( msg, resolve, reject ) {

        var template = '                                                     \
        <div class="modal-dialog modal-dialog-centered" role="document">     \
          <div class="modal-content text-center bg-light py-2">              \
            <p>%MESSAGE%</p>                                                 \
            <div class="modal-footer">                                       \
              <button type="button" class="btn btn-success mx-auto px-3"     \
                      data-dismiss="modal">接受</button>                     \
              <button type="button" class="btn btn-danger mx-auto px-3"      \
                      data-dismiss="modal">拒绝</button>                     \
            </div>                                                           \
          </div>                                                             \
        </div>';

        var dialog = createDialog( template.replace( '%MESSAGE%', msg ) );
        $( dialog ).modal( 'show' );

        dialog.querySelector( 'button.btn-success' ).addEventListener( 'click', resolve, false );
        dialog.querySelector( 'button.btn-danger' ).addEventListener( 'click', reject, false );

    };

    var caller = function ( msg, reject ) {

        var template = '                                                     \
        <div class="modal-dialog modal-dialog-centered" role="document">     \
          <div class="modal-content text-center bg-light py-2">              \
            <p>%MESSAGE%</p>                                                 \
            <div class="modal-footer">                                       \
              <button type="button" class="btn btn-danger mx-auto px-3"      \
                      data-dismiss="modal">挂断</button>                     \
            </div>                                                           \
          </div>                                                             \
        </div>';

        var dialog = createDialog( template.replace( '%MESSAGE%', msg ) );
        $( dialog ).modal( 'show' );

        // dialog.querySelector( 'button.btn-danger' ).addEventListener( 'click', reject, false );
        $( dialog ).on( 'hidden.bs.modal', function ( e ) {
            reject();
        } );

        var hide = function () {
            $( dialog ).off( 'hidden.bs.modal' ).modal('hide');
        };
        var feedback = function ( msg ) {
            $( dialog ).off( 'hidden.bs.modal' );
            $( '.modal-content', dialog )
                .removeClass( 'bg-light' )
                .addClass( 'bg-warning' )
                .html( '<span>%MESSAGE%</span>'.replace( '%MESSAGE%', msg ) );
        };

        return {
            hide: hide,
            feedback: feedback,
        };

    };


    /**
     * 弹出对话框，在中间显示 items 的所有选项，选中项目之后，调用 callback。
     * 如果 opt_keep 为真，那么调用 callback 之后不关闭对话框，否则关闭对话框
     * 点击其他任何空白区域都直接关闭对话框
     */
    var picker = function ( items, callback, opt_keep ) {
        var dialog = createDialog( _ITEM_SELECTOR_TEMPLATE.replace( '%BUTTONS%', items ) );
        $( dialog ).modal( 'show' );
        $( 'button', dialog ).on( 'click', function ( e ) {
            callback( e );
            if ( ! opt_keep )
                $( dialog ).modal( 'hide' );
        } );
    };

    return {
        login: login,
        signup: signup,
        askfor: askfor,
        info: info,
        warning: warning,
        acceptor: acceptor,
        caller: caller,
        picker: picker,
    };

} );
