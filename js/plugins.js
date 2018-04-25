define({

    toolcase: [
        {
            name: 'search',
            source: 'plugins/toolcase/search',
            options: {}
        },
        {
            name: 'toolbox',
            source: 'plugins/toolcase/toolbox',
            options: {}
        },
        {
            name: 'talk',
            source: 'plugins/toolcase/talk',
            options: {}
        },
        {
            name: 'maplayer',
            source: 'plugins/toolcase/maplayer',
            options: {}
        },
        {
            name: 'favorite',
            source: 'plugins/toolcase/favorite',
            options: {}
        },
        {
            name: 'footmark',
            source: 'plugins/toolcase/footmark',
            options: {}
        },
        {
            name: 'login',
            source: 'plugins/toolcase/login',
            options: {}
        },
        {
            name: 'navigator',
            source: 'plugins/toolcase/navigator',
            options: {}
        },
    ],

    showcase: [
        {
            name: 'photo',
            mimetypes: [ 'image/jpeg', 'image/png', 'image/*' ],
            source: 'plugins/showcase/photo',
            options: {}
        },
        {
            name: 'panorama',
            source: 'plugins/showcase/panorama',
            mimetypes: [ 'panorama/equirectangular', 'panorama/cubemap', 'panorama/multires' ],
            options: {}
        },
        {
            name: 'video5',
            source: 'plugins/showcase/video5',
            mimetypes: [ 'video/mp4', 'video/ogg', 'video/*' ],
            options: {}
        },
        {
            name: 'living',
            source: 'plugins/showcase/living',
            options: {}
        },
        {
            name: 'page',
            source: 'plugins/showcase/page',
            options: {}
        },
    ]

});
