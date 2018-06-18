define( [ 'config', 'app/application'  ],

function( config, Application ) {

    var app = new Application( config );

    app.run();

} );
