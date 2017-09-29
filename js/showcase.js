define( [], function () {

    var _user = {
        name: window.localStorage.getItem('userName', ''),
        uuid: window.localStorage.getItem('userUuid', ''),
        token: window.localStorage.getItem('loginToken', '')
    };

    return {

        cordova: undefined,
        user: _user

    }

});
