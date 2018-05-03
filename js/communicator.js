define( [ 'ifuture', 'easyrtc', 'config', 'utils' ], function( ifuture, easyrtc, config, utils ) {

    var easyrtcServerUrl = 'http://snsoffice.com:9090';
    var easyrtcAppkey = 'snsoffice.ifuture.sky';

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
    var Communicator = function ( app, opt_options ) {

        ifuture.Component.call( this );

        /**
         * @private
         * @type {ifuter.Application}
         */
        this.app_ = app;

        /**
         * @private
         * @type {string}
         */
        this.portrait_ = opt_options.portrait;

        /**
         * @private
         * @type {string}
         */
        this.easyrtcAppKey_ = opt_options.appKey;

        /**
         * @private
         * @type {string}
         */
        this.roomName_ = '';

        /**
         *
         * @private
         * @type {string} easyrtcid
         */
        this.easyrtcId_ = '';

        /**
         * @private
         * @type {number>}
         */
        this.videoWidth_ = 240;

        /**
         * @private
         * @type {number>}
         */
        this.videoHeight_ = 180;

    };

    ifuture.inherits( Communicator, ifuture.Component );

    /**
     * 初始化 easyrtc，建立连接
     * @private
     */
    Communicator.prototype.initEasyrtc_ = function () {

        easyrtc.setOnError( function ( errObj ) {
            utils.warning( errObj.errorText );
        } );

        easyrtc.setSocketUrl( easyrtcServerUrl );
        easyrtc.usernameRegExp = new RegExp( '[_a-zA-Z0-9\s\u4E00-\u9FA5\uF900-\uFA2D]+' );
        easyrtc.setUsername( this.userName_ );
        easyrtc.setPeerListener( this.peerListener_.bind( this ) );
        easyrtc.setPeerClosedListener( this.peerClosedListener_.bind( this ) );
        easyrtc.setAcceptChecker( this.onRequestTalking_.bind( this ) );
        // easyrtc.setVideoDims( this.videoWidth_, this.videoHeight_ );
        easyrtc.setRoomOccupantListener( this.onRoomOccupants_.bind( this ) );

        easyrtc.connect(
            this.easyrtcAppKey_,
            this.loginSuccess_.bind( this ),
            this.loginFailure_.bind( this )
        );

    };


    /**
     * 连接成功之后的初始化
     *
     * @param {sns.EasyrtcId} easyrtcid
     * @private
     */
    Communicator.prototype.loginSuccess_ = function ( easyrtcid ) {
        this.easyrtcId_ = easyrtcid;
        this.set( 'connected', true );
    };


    /**
     * 连接失败
     *
     * @param {number} errorCode
     * @param {string} errorText
     * @private
     */
    Communicator.prototype.loginFailure_ = function ( errorCode, errorText ) {
        this.easyrtcId_ = '';
        console.log( 'easyrtc return error ' + errorCode + ': ' + errorText );
        utils.warning( '连接通信服务失败' );
    };

    /**
     *
     * 对方请求通话或者直播的事件处理
     *
     * @param {string} easyrtcid
     * @param {function} acceptor
     *
     */
    Communicator.prototype.onRequestTalking_ = function ( easyrtcid, acceptor ) {

        this.app_.request( 'responsebar', 'show', [
            easyrtc.idToName( easyrtcid ) + '请求直播?',
            function () { acceptor( true ); },
            function () { acceptor( false ); }
        ] );

    };

    /**
     *
     * 进入房间之后的事件处理
     *
     *     如果是观看直播，那么首先找到主播，然后呼叫主播
     *     如果是主播，那么不做任何操作
     *
     * @param {string} roomName
     * @param {Object} occupants
     * @param {boolean} isPrimary
     */
    Communicator.prototype.onRoomOccupants_ = function ( roomName, occupants, isPrimary ) {

        if ( this.roomName_ === roomName ) {

            var anchor;

            if ( isPrimary )
                return;

            for( var other in occupants ) {
                if ( occupants[ other ].apiField.anchor && occupants[ other ].apiField.anchor.fieldValue === true ) {
                    anchor = other;
                    break;
                }
            }

            if ( anchor === this.easyrtcid_ )
                return;

            if ( anchor === undefined ) {
                utils.warning( '这里(' + roomName + ')没有直播信号' );
                return;
            }

            if ( config.userName === undefined ) {
                config.userName = 'tester';
                this.setUsername( 'tester' );
            }

            if( ! easyrtc.setUsername( userName ) ) {
                utils.warning( '设置用户名称失败' );
                return ;
            }

            this.callAnchor_( roomName, anchor );

        }

    };

    /**
     *
     * 呼叫主播
     *
     * @param {string} roomName
     * @param {string} anchor, easyrtcid
     *
     */
    Communicator.prototype.callAnchor_ = function ( roomName, anchor ) {

        var app = this.app_;

        var acceptedCB = function ( accepted, easyrtcid ) {

            if( accepted ) {
                app.dispatchEvent( new ifuture.Event( 'living:opened' ) );
            }

            else
                utils.warning( '你的直播请求没有被接受' );

        };

        var successCB = function ( otherCaller, mediaType ) {

        };

        var failureCB = function ( errorCode, errorText ) {

            utils.warning( '直播请求失败: ' + errorText );

        };

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( false );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( true );

        easyrtc.hangupAll();
        easyrtc.call( anchor, successCB, failureCB, acceptedCB );

    };

    /**
     *
     * @param {string} who
     * @param {string} msgType
     * @param {Object} msgData
     */
    Communicator.prototype.peerListener_ = function( who, msgType, msgData ) {

        if ( who === this.easyrtcid_ )
            return;

        if ( msgType === 'camera' ) {

            // sendPeerMessage(destination, msgType, msgData, successCB, failureCB);

            // @param {String} destination - either a string containing
            // the easyrtcId of the other user, or an object containing
            // some subset of the following fields: targetEasyrtcid,
            // targetGroup, targetRoom.

        }

        else
            console.log('peer message: ' + msgType + ' from ' + who);
    };


    /**
     * 协作完成之后，对方挂断之后的处理
     *
     * @param {string} easyrtcid
     */
    Communicator.prototype.peerClosedListener_ = function ( easyrtcid ) {
        console.log( 'easyrtc: peer ' + easyrtcid + ' closed' );
    };


    Communicator.prototype.startBroadcast = function ( roomName ) {

        this.roomName_ = roomName;

        // 开始直播
        var explorer = document.getElementById( 'explorer' );
        var container = document.createElement( 'DIV' );
        container.className = 'dx-showcase';
        container.innerHTML = '<video autoplay="autoplay" class="dx-mirror dx-video" muted="muted" volume="0"></video>';
        explorer.appendChild( container );

        easyrtc.enableAudio( true );
        easyrtc.enableVideo( true );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( false );

        easyrtc.initMediaSource(
            function( mediastream ) {
                var rect = container.getBoundingClientRect();
                var video = container.firstElementChild;
                video.setAttribute( 'width', rect.width );
                video.setAttribute( 'height', rect.height );
                easyrtc.setVideoObjectSrc( video, mediastream );
            },
            function( errorCode, errorText ){
                console.log( 'initMediaSource return ' + errorCode + ': '  + errorText );
                utils.warning( '初始化直播服务失败: ' + errorText );
            }
        );

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {} );
        easyrtc.setOnStreamClosed( function ( easyrtcid ) {} );

        easyrtc.joinRoom( roomName, null,
            function ( roomName ) {
                console.log( 'Joined room: ' + roomName );
                easyrtc.setRoomApiField( roomName, 'anchor', true );
            },
            function ( errorCode, errorText, roomName ) {
                this.roomName_ = '';
                console.log( 'Join room  ' + roomName + ' return ' + errorCode + ': '  + errorText);
                utils.warning( '无法进行直播: ' + errorText );
            }
        );

    };

    Communicator.prototype.stopBroadcast = function () {

        var roomName = this.roomName_;
        if ( roomName ) {
            // easyrtc.setRoomApiField( roomName, 'anchor', false );
            easyrtc.leaveRoom( roomName );
            this.roomName_ = '';
        }

        var explorer = document.getElementById( 'explorer' );
        var container = explorer.querySelector( '.dx-showcase' );
        if ( container ) {
            var video = container.firstElementChild;
            easyrtc.clearMediaStream( video );
            easyrtc.setVideoObjectSrc( video, '' );
            easyrtc.closeLocalMediaStream();
            container.remove();
        }

    };

    Communicator.prototype.openLiving = function ( roomName ) {

        easyrtc.setStreamAcceptor( function ( easyrtcid, stream ) {
            var explorer = document.getElementById( 'explorer' );
            var container = document.createElement( 'DIV' );
            container.className = 'dx-showcase';
            container.innerHTML = '<video autoplay="autoplay" class="dx-video"></video>';
            explorer.appendChild( container );

            var rect = container.getBoundingClientRect();
            var video = container.firstElementChild;
            video.setAttribute( 'width', rect.width );
            video.setAttribute( 'height', rect.height );

            easyrtc.setVideoObjectSrc( video, stream );
        });

        easyrtc.setOnStreamClosed( function ( easyrtcid ) {
            var container = document.querySelector( '#explorer > .dx-showcase' );
            if ( container ) {
                var video = item.firstElementChild;
                easyrtc.setVideoObjectSrc( video, '');
                easyrtc.clearMediaStream( video );
                easyrtc.closeLocalMediaStream();
                container.remove();
            }
        } );

        this.roomName_ = roomName;
        easyrtc.joinRoom( roomName, null,
            function ( roomName ) {
                console.log( 'Joined room: ' + roomName );
            },
            function ( errorCode, errorText, roomName ) {
                this.roomName_ = '';
                console.log( 'Join room  ' + roomName + ' return ' + errorCode + ': '  + errorText);
                utlils.warning( '无法观看直播: ' + errorText );
            }
        );

    };

    Communicator.prototype.closeLiving = function () {

        var roomName = this.roomName_;
        if ( roomName ) {
            easyrtc.leaveRoom( roomName );
            this.roomName_ = '';
        }

    };

    Communicator.prototype.start = function () {
        this.initEasyrtc_();
    };

    Communicator.prototype.restart = function () {
    };

    Communicator.prototype.stop = function () {
        easyrtc.hangupAll();
        easyrtc.disconnect();
    };

    return Communicator;

} );
