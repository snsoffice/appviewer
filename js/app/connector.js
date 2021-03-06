define( [ 'ifuture', 'easyrtc', 'config', 'utils', 'logger', 'app/dialog' ],
        
function( ifuture, easyrtc, config, utils, logger, dialog ) {

    var _EASYRTC_SERVER = 'http://snsoffice.com:9090';
    var _EASYRTC_APPKEY = 'snsoffice.ifuture.sky';

    var _USER_NAME_REGEXP = '[_a-zA-Z0-9\s\u4E00-\u9FA5\uF900-\uFA2D]+';

    var _MESSAGE_TYPE = {
        ANCHOR: 'anchor',
        VIEW: 'view',
    };
            
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
         * 主播的连接信息
         * @private
         * @type {Object} 属性 anchor 和 token
         */
        this._callee = null;

        /**
         * 观看者的连接Id
         * @private
         * @type {string} easyrtcid
         */
        this._otherId = null;

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
        easyrtc.setPeerListener( this.peerListener_.bind( this ) );
        easyrtc.setPeerClosedListener( this.peerClosedListener_.bind( this ) );
        easyrtc.setAcceptChecker( this.acceptChecker_.bind( this ) );
        easyrtc.setOnError( this.onEasyrtcError_.bind( this ) );

        // if ( typeof config.userId === 'string' )
        //     easyrtc.setUsername( config.userId );

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
        case easyrtc.errCodes.BAD_NAME: // a user name wasn't of the desired form
        case easyrtc.errCodes.CALL_ERR: // something went wrong creating the peer connection
        case easyrtc.errCodes.DEVELOPER_ERR: // the developer using the EasyRTC library made a mistake
        case easyrtc.errCodes.SYSTEM_ERR: // probably an error related to the network
        case easyrtc.errCodes.CONNECT_ERR: // error occurred when trying to create a connection
        case easyrtc.errCodes.MEDIA_ERR: // unable to get the local media
        case easyrtc.errCodes.MEDIA_WARNING: // didn't get the desired resolution
        case easyrtc.errCodes.INTERNAL_ERR:
        case easyrtc.errCodes.PEER_GONE: // peer doesn't exist
        case easyrtc.errCodes.ALREADY_CONNECTED:
        case easyrtc.errCodes.BAD_CREDENTIAL:
        case easyrtc.errCodes.ICECANDIDATE_ERR:
        case easyrtc.errCodes.NOVIABLEICE:
        case easyrtc.errCodes.SIGNAL_ERR:
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
    Connector.prototype.loginSuccess_ = function ( easyrtcId ) {
        this._easyrtcId = easyrtcId;
        config.settings.easyrtcId = easyrtcId;
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
        config.settings.easyrtcId = null;
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

        var scope = this;

        var accept = function () {
            acceptor( true );
            scope._otherId = easyrtcid;
            scope.dispatchEvent( new ifuture.Event( 'living:connected' ) );
        },

        reject = function () {
            acceptor( false );
            scope._otherId = null;
        };

        dialog.acceptor( '用户请求直播看房?', accept, reject );

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
        var msgbox = null;

        var successCB = function ( otherCaller, mediaType ) {
            scope._callee = callee;
            msgbox.hide();
            scope.dispatchEvent( new ifuture.Event( 'living:connected' ) );
        };

        var failureCB = function ( errorCode, errorText ) {
            scope._callee = null;
            msgbox.feedback( '没有接通，对方忙或者还没有开始直播' );
            scope.dispatchEvent( new ifuture.Event( 'close:screen' ) );
        };

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( false );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( true );

        easyrtc.hangupAll();
        easyrtc.call( callee.token, successCB, failureCB );

        var reject = function () {
            easyrtc.hangupAll();
        };
        msgbox = dialog.caller( '正在呼叫 ' + callee.anchor + ' ...', reject );

    };

    /**
     *
     * @param {string} who
     * @param {string} msgType
     * @param {Object} msgData
     */
    Connector.prototype.sendPeerMessage_ = function( msgType, msgData ) {

        var destination = this._callee && this._callee.token ? this._callee.token : this._otherId;

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

        if ( msgType === _MESSAGE_TYPE.ANCHOR ) {

            this.dispatchEvent( new ifuture.Event( 'remote:marker:changed', msgData ) );

        }

        else if ( msgType === _MESSAGE_TYPE.VIEW ) {

            this.dispatchEvent( new ifuture.Event( 'remote:view:changed', msgData ) );

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
        this.closeLocalMediaStream_();

    };


    /**
     * 关闭本地多媒体设备
     *
     */
    Connector.prototype.closeLocalMediaStream_ = function ( easyrtcid ) {

        if ( this._video === null )
            return;

        easyrtc.clearMediaStream( this._video );
        easyrtc.setVideoObjectSrc( this._video, '' );
        easyrtc.closeLocalMediaStream();

        this._video = null;

        this.dispatchEvent( new ifuture.Event( 'living:disconnected' ) );

    };

    /**
     * 打开直播视频，开始直播
     *
     * @param {HTMLVideoElement} video
     */
    Connector.prototype.startLiving_ = function ( video ) {

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( true );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( false );

        var scope = this;
        scope._video = video;
        scope._otherId = null;

        easyrtc.initMediaSource(
            function( mediastream ) {
                if ( scope._video !== null ) {
                    video.classList.add( 'dx-mirror' );
                    easyrtc.setVideoObjectSrc( video, mediastream );
                }
            },
            function( errorCode, errorText ){
                scope._video = null;
                logger.log( 'initMediaSource return ' + errorCode + ': '  + errorText );
                dialog.info( '打开摄像头和话筒时出现错误，无法进行直播' );
            }
        );

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {} );
        easyrtc.setOnStreamClosed( function ( easyrtcid ) {} );

    };

    /**
     * 开始观看直播
     *
     * @param {HTMLVideoElement} video
     * @param {Object} callee, 包括 anchor 和 token 两个属性
     */
    Connector.prototype.watchLiving_ = function ( video, callee ) {

        var scope = this;

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {
            video.classList.remove( 'dx-mirror' );
            easyrtc.setVideoObjectSrc( video, stream );
            scope._video = video;
        });

        easyrtc.setOnStreamClosed( function ( easyrtcid ) {} );

        this.callAnchor_( callee );

    };


    Connector.prototype.start = function () {
        this.initEasyrtc_();
    };

    Connector.prototype.stop = function () {
        easyrtc.hangupAll();
        easyrtc.disconnect();
        this._easyrtcId = null;
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
            this.sendPeerMessage_( _MESSAGE_TYPE.ANCHOR, event.argument );
        }, this );

        this.app.on( 'send:view', function ( event ) {
            this.sendPeerMessage_( _MESSAGE_TYPE.VIEW, event.argument );
        }, this );

        this.app.on( 'screen:closed', function ( event ) {
            this.closeLocalMediaStream_();
        }, this );

        this.app.on( 'start:living', function ( event ) {
            var arg = event.argument;
            this.startLiving_( arg.video );
        }, this );

        this.app.on( 'watch:living', function ( event ) {
            var arg = event.argument;
            this.watchLiving_( arg.video, arg.callee );
        }, this );

        this.app.on( 'disconnect:living', function ( event ) {
            easyrtc.hangupAll();
        }, this );

    };

    return Connector;

} );
