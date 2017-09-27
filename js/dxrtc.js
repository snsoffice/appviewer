requirejs( [ 'easyrtc', 'utils' ], function ( easyrtc, utils ) {

    var _server = 'http://snsoffice.com:9090';
    var _appname = 'plone-nowadays';
    var _easyrid = undefined;

    function Overview(path, description) {
        this.path = path;
        this.description = description;
    }

    Overview.prototype.save = function () {
        return db.folders.put(this);
    }


    function onConnect( rid, room ) {
        _easyrid = rid;
    }

    function onFailed( event, msg ) {
        utils.warning( '连接 WebRTC 服务 ' + _server + ' 失败: ' + msg );
    }

    easyrtc.setSocketUrl( _server );
    easyrtc.connect( _appname,onConnect, onFailed );

    return Overview;

});
