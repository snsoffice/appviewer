define( [ 'ifuture', 'easyrtc', 'config', 'utils', 'logger', 'app/dialog' ],
        function( ifuture, easyrtc, config, utils, logger, dialog ) {

    var _EASYRTC_SERVER = 'http://snsoffice.com:9090';
    var _EASYRTC_APPKEY = 'snsoffice.ifuture.sky';

    var _DEFAULT_ROOM_NAME = 'default';
    var _USER_NAME_REGEXP = '[_a-zA-Z0-9\s\u4E00-\u9FA5\uF900-\uFA2D]+';

    /**
     * @classdesc
     *
     * 通信器，使用 easyrtc 提供直播过程的控制信息和声音视频的传输。
     *
     * @constructor
     * @extends {ifuture.Component}
     * @param {Application} app
     * @param {Object} opt_options
     * @api stable
     */
    var Connector = function ( app, opt_options ) {

        ifuture.Component.call( this, app );

        /**
         * 等价于 easyrtc.myEasyrtcid
         * @private
         * @type {string} easyrtcid
         */
        this._easyrtcId = null;

        /**
         * 被呼叫方的 easyrtcid
         * @private
         * @type {string} easyrtcid
         */
        this._callee = null;

        /**
         * 视频元素
         * @private
         * @type {HTMLVideoElement}
         */
        this._video = null;

    };

    ifuture.inherits( Connector, ifuture.Component );

    /**
     * 初始化 easyrtc，建立连接
     * @private
     */
    Connector.prototype.initEasyrtc_ = function () {

        easyrtc.setSocketUrl( _EASYRTC_SERVER );
        easyrtc.usernameRegExp = new RegExp( _USER_NAME_REGEXP );
        easyrtc.setUsername( config.userName === null ? '用户' : config.userName );
        easyrtc.setPeerListener( this.peerListener_.bind( this ) );
        easyrtc.setPeerClosedListener( this.peerClosedListener_.bind( this ) );
        easyrtc.setAcceptChecker( this.acceptChecker_.bind( this ) );
        easyrtc.setOnError( this.onEasyrtcError_.bind( this ) );


        easyrtc.connect(
            _EASYRTC_APPKEY,
            this.loginSuccess_.bind( this ),
            this.loginFailure_.bind( this )
        );

    };

    /**
     * 处理 easyrtc 的错误
     * @private
     */
    Connector.prototype.onEasyrtcError_ = function ( errObj ) {

        logger.log( 'Easyrtc report ' + errObj.errorCode + ' : ' + errObj.errorText );

        switch ( errObj.errorCode ) {
        case BAD_NAME: // a user name wasn't of the desired form
        case CALL_ERR: // something went wrong creating the peer connection
        case DEVELOPER_ERR: // the developer using the EasyRTC library made a mistake
        case SYSTEM_ERR: // probably an error related to the network
        case CONNECT_ERR: // error occurred when trying to create a connection
        case MEDIA_ERR: // unable to get the local media
        case MEDIA_WARNING: // didn't get the desired resolution
        case INTERNAL_ERR:
        case PEER_GONE: // peer doesn't exist
        case ALREADY_CONNECTED:
        case BAD_CREDENTIAL:
        case ICECANDIDATE_ERR:
        case NOVIABLEICE:
        case SIGNAL_ERR:
            break;

        default:
            break;
        };

    };

    /**
     * 连接成功之后的初始化
     *
     * @param {sns.EasyrtcId} easyrtcid
     * @private
     */
    Connector.prototype.loginSuccess_ = function ( easyrtcid ) {
        this._easyrtcId = easyrtcid;
    };


    /**
     * 连接失败
     *
     * @param {number} errorCode
     * @param {string} errorText
     * @private
     */
    Connector.prototype.loginFailure_ = function ( errorCode, errorText ) {
        this._easyrtcId = null;
    };

    /**
     *
     * 对方请求通话或者直播的事件处理
     *
     * @param {string} easyrtcid
     * @param {function} acceptor
     *
     */
    Connector.prototype.acceptChecker_ = function ( easyrtcid, acceptor ) {

        dialog.acceptor(
            easyrtc.idToName( easyrtcid ) + '请求直播看房?',
            function () { acceptor( true ); },
            function () { acceptor( false ); }
        );

    };

    /**
     *
     * 呼叫主播
     *
     * @param {string} roomName
     * @param {string} callee, easyrtcid
     *
     */
    Connector.prototype.callAnchor_ = function ( callee ) {

        var scope = this;
        var accepted = null;
        var dialog = null;

        var successCB = function ( otherCaller, mediaType ) {
            scope._callee = callee;
            dialog.hide();
            scope.dispatchEvent( new ifuture.Event( 'open:screen' ) );
        };

        var failureCB = function ( errorCode, errorText ) {
            scope._callee = null;
            dialog.feedback( '没有接通，对方忙或者还没有开始直播' );
        };

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( false );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( true );

        easyrtc.hangupAll();
        easyrtc.call( anchor, successCB, failureCB, acceptedCB );

        var reject = function () {
            easyrtc.hangupAll();
        };
        dialog = dialog.caller( '正在呼叫...', reject );

    };

    /**
     *
     * @param {string} who
     * @param {string} msgType
     * @param {Object} msgData
     */
    Connector.prototype.sendPeerMessage_ = function( msgType, msgData ) {

        if ( this._callee === null )
            return;

        var destination = this._callee;
        var successCB = function () {
            logger.log( 'Send message to ' + destination + ': ' + msgType + ' OK' );
        };
        var failureCB = function () {
            logger.log( 'Send message to ' + destination + ': ' + msgType + ' FAILED' );
        };
        easyrtc.sendPeerMessage( destination, msgType, msgData, successCB, failureCB );

    };

    /**
     *
     * @param {string} who
     * @param {string} msgType
     * @param {Object} msgData
     */
    Connector.prototype.peerListener_ = function( who, msgType, msgData ) {

        if ( who === this._easyrtcid )
            return;

        if ( msgType === 'anchor' ) {

            this.dispatchEvent( new ifuture.Event( 'helper:changed', msgData ) );

        }

        else
            logger.log('Peer message: ' + msgType + ' from ' + who);
    };


    /**
     * 协作完成之后，对方挂断之后的处理
     *
     * @param {string} easyrtcid
     */
    Connector.prototype.peerClosedListener_ = function ( easyrtcid ) {

        logger.log( 'Easyrtc: peer ' + easyrtcid + ' closed' );
        if ( this._video === null )
            return;

        easyrtc.clearMediaStream( this._video );
        easyrtc.setVideoObjectSrc( this._video, '' );
        easyrtc.closeLocalMediaStream();

        this._video = null;

    };


    Connector.prototype.startLiving_ = function ( video ) {

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( true );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( false );

        var scope = this;

        easyrtc.initMediaSource(
            function( mediastream ) {
                easyrtc.setVideoObjectSrc( video, mediastream );
                scope._video = video;
            },
            function( errorCode, errorText ){
                logger.log( 'initMediaSource return ' + errorCode + ': '  + errorText );
                dialog.info( '打开摄像头和话筒时出现错误，无法进行直播' );
            }
        );

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {} );
        easyrtc.setOnStreamClosed( function ( easyrtcid ) {} );

    };

    Connector.prototype.watchLiving_ = function ( video, callee ) {

        var scope = this;

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {
            easyrtc.setVideoObjectSrc( video, stream );
            scope._video = video;
        });

        easyrtc.setOnStreamClosed( function ( easyrtcid ) {
        } );

        this.callAnchor_( callee );

    };


    Connector.prototype.start = function () {
        this.initEasyrtc_();
    };

    Connector.prototype.restart = function () {
        this.stop();
        this.start();
    };

    Connector.prototype.stop = function () {
        easyrtc.hangupAll();
        easyrtc.disconnect();
    };

    Connector.prototype.userNameToEasyrtcid_ = function ( userName ) {

        var occupants = easyrtc.getRoomOccupantsAsMap( _DEFAULT_ROOM_NAME );

        for ( var easyrtcid in occupants ) {

            if ( ! occupants.hasOwnProperty( easyrtcid ) )
                continue;

            if ( occupants[ easyrtcid ].userName === userName )
                return easyrtcid;

        }

    };

    /**
     *
     * 事件处理程序，相对于对外部的所有接口，可以响应的外部事件
     *
     * @param {ifuture.Event} event 事件对象
     * @observable
     * @api
     */
    Connector.prototype.bindFutureEvent = function () {

        this.app.on( 'send:anchor', function ( event ) {
            var arg = event.argument;
            this.sendPeerMessage_( arg.msgType, arg.msgData );
        }, this );

        this.app.on( 'user:changed', function ( event ) {
            if( ! easyrtc.setUsername( config.userName ) ) {
                logger.log( '设置用户名称失败' );
            }
        }, this );

        this.app.on( 'start:living', function ( event ) {
            var arg = event.argument;
            this.startLiving_( arg.video );
        }, this );

        this.app.on( 'watch:living', function ( event ) {
            var arg = event.argument;
            this.watchLiving_( arg.video, arg.callee );
        }, this );

    };

    return Connector;

} );
