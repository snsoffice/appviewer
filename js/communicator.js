define( [ 'ifuture', 'easyrtc' ], function( ifuture, easyrtc ) {

    var defaultRoomName = 'sns.collaborator';
    var easyrtcServerUrl = 'http://snsoffice.com:9090';
    var easyrtcAppkey = 'sns.ifuture';

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
         * @type {string}
         */
        this.userId_ = opt_options.userId;

        /**
         * @private
         * @type {string}
         */
        this.userName_ = opt_options.userName;

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
        this.roomName_ = defaultRoomName;

        /**
         * @private
         * @type {boolean}
         */
        this.remoteLoading_ = false;

        /**
         *
         * @private
         * @type {sns.EasyrtcId}
         */
        this.easyrtcId_ = '';

    };

    ifuture.inherits( Communicator, ifuture.Component );

    /**
     * 初始化 easyrtc，建立连接
     * @private
     */
    Communicator.prototype.initEasyrtc_ = function (){
        easyrtc.setSocketUrl(easyrtcServerUrl);
        easyrtc.usernameRegExp = new RegExp('[_a-zA-Z0-9\s\u4E00-\u9FA5\uF900-\uFA2D]+');
        easyrtc.setUsername(this.userName_);
        easyrtc.setPeerListener(this.peerListener_.bind(this));
        easyrtc.setPeerClosedListener(this.peerClosedListener_.bind(this));

        easyrtc.setVideoDims(160, 120);
        easyrtc.setRoomOccupantListener(this.onRoomOccupants_.bind(this));

        easyrtc.connect(
            this.easyrtcAppKey_,
            this.loginSuccess_.bind(this),
            this.loginFailure_.bind(this)
        );
        // easyrtc.easyApp(
        //   this.easyrtcAppKey_,
        //   'meeting-video-self', ['meeting-video-other'],
        //   this.loginSuccess_, this.loginFailure_
        // );
    };


    /**
     * 连接成功之后的初始化
     *
     * @param {sns.EasyrtcId} easyrtcid
     * @private
     */
    Communicator.prototype.loginSuccess_ = function (easyrtcid) {
        this.easyrtcId_ = easyrtcid;
        this.set('connected', true);
    };


    /**
     * 连接失败
     *
     * @param {number} errorCode
     * @param {string} message
     * @private
     */
    Communicator.prototype.loginFailure_ = function (errorCode, message) {
        sns.showError(message);
    };

    /**
     *
     * @param {string} roomName
     * @param {Object} occupants
     * @param {boolean} isPrimary
     */
    Communicator.prototype.onRoomOccupants_ = function (roomName, occupants, isPrimary) {
    };

    /**
     *
     * @param {string} who
     * @param {string} msgType
     * @param {Object} msgData
     */
    Communicator.prototype.peerListener_ = function(who, msgType, msgData) {
        if (who === this.easyrtcid_)
            return;

        var participant = this.otherParticipants_[who];
        if (!participant){
            sns.showError('未知的远程用户 ' + who);
            return;
        }

        if (msgType === 'page'){
            this.set('remoteController', who);
            participant.executePageCommand(/** @type {sns.PageCommandMessage} */(msgData));
        }

        else if (msgType === 'presentation'){
            this.set('remoteController', who);
            this.remoteLoading_ = true;
            this.loadPresentation(/** @type {string} */(msgData.uri));
        }

        else if (msgType === 'marker')
            participant.executeMarkerCommand(/** @type {sns.MarkerCommandMessage} */(msgData));

        else if (typeof this.messageCallback_ === 'function')
            this.messageCallback_(who, msgType, msgData);

        else
            console.log('peer message: ' + msgType + ' from ' + who);
    };


    /**
     * 协作完成之后，对方挂断之后的处理
     *
     * @param {string} easyrtcid
     */
    Communicator.prototype.peerClosedListener_ = function(easyrtcid){
        if (this.roomName_ !== sns.DEFAULT_ROOM){
            var users = easyrtc.getRoomOccupantsAsArray(this.roomName_);
            if (users && users.indexOf(easyrtcid) !== -1){
                sns.showMessage(easyrtc.idToName(easyrtcid) + '已经挂断');
            }
        }
    };

    /**
     * 得到当前所有连接的用户，返回 select2 数据
     *
     * @return {Array.<Object>}
     * @api stable
     */
    Communicator.prototype.getOtherUsers = function (){
        var users = [];
        var ids = easyrtc.getRoomOccupantsAsArray(sns.DEFAULT_ROOM);
        if (ids){
            var myid = this.easyrtcId_;
            ids.forEach(function(rid){
                if (rid !== myid)
                    users.push({
                        id: rid,
                        text: easyrtc.idToName(rid)
                    });
            });
        }
        return users;
    };

    return Communicator;

} );
