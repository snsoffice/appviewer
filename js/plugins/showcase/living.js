define( [ 'ifuture', 'showcase', 'easyrtc', 'utils' ], function( ifuture, Showcase, easyrtc, utils ) {

    Living = function ( app, opt_options ) {
        Showcase.call( this );
    }
    ifuture.inherits( Living, Showcase );

    Living.prototype.open = function ( roomName ) {

        var users = easyrtc.getRoomOccupantsAsArray( roomName );
        if ( ! users.length ) {
            utils.warning( '这里还没有人在直播: ' + roomName );
            return false;
        }

        var anchor = users[ 0 ];
        easyrtc.enableAudio( true );
        easyrtc.enableVideo( false );
        easyrtc.enableAudioReceive( true );
        easyrtc.enableVideoReceive( true );

        easyrtc.setAcceptChecker( function ( easyrtcid, acceptor ){

            // if( easyrtc.idToName(easyrtcid) === 'Fred' ){
            //     acceptor( true );
            // }

            acceptor( true );

        } );

        function disconnect() {
            easyrtc.clearMediaStream( document.getElementById("selfVideo") );
            easyrtc.setVideoObjectSrc(document.getElementById("selfVideo"), "");
            easyrtc.closeLocalMediaStream();
        }
        easyrtc.setStreamAcceptor( function(easyrtcid, stream) {
            setUpMirror();
            var video = document.getElementById("callerVideo");
            easyrtc.setVideoObjectSrc(video, stream);
            enable("hangupButton");
        });
        easyrtc.setOnStreamClosed( function (easyrtcid) {
            easyrtc.setVideoObjectSrc(document.getElementById("callerVideo"), "");
            disable("hangupButton");
        });
        var callerPending = null;
        easyrtc.setCallCancelled( function(easyrtcid){
            if( easyrtcid === callerPending) {
                document.getElementById("acceptCallBox").style.display = "none";
                callerPending = false;
            }
        });

        easyrtc.hangupAll();
        var acceptedCB = function( accepted, easyrtcid ) {
            if( !accepted ) {
                easyrtc.showError("CALL-REJECTEd", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
                enable("otherClients");
            }
        };
        var successCB = function() {
            if( easyrtc.getLocalStream()) {
                setUpMirror();
            }
            enable("hangupButton");
        };
        var failureCB = function() {
            enable("otherClients");
        };
        easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);

    };

    Living.prototype.close = function () {
    };

    return Living;

} );
