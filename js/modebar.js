define( [ 'ifuture' ],

function( ifuture ) {

    Modebar = function ( app, opt_options ) {
        ifuture.Component.call( this );

        var element = document.getElementById( 'modebar' );
        this.element = element;

        this.mode = '';
        this.modeName = [];
        this.modeList = [];

        element.querySelector( '#modebar > button' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            // this.resetMode();
            // this.element.style.visibility = 'hidden';

        }.bind( this ), false );

    }
    ifuture.inherits( Modebar, ifuture.Component );

    Modebar.prototype.add = function ( name, component ) {
        var index = this.modeName.indexOf( name );
        if ( index === -1 ) {
            this.modeName.push( name );
            this.modeList.push( component );
        }
        else
            this.modeList[ index ] = component;
    };

    Modebar.prototype.remove = function ( name ) {
        if ( name === this.mode )
            this.resetMode();
        var index = this.modeName.indexOf( name );
        if ( index > -1 ) {
            this.modeName.splice( index, 1 );
            this.modeList.splice( index, 1 );
        }
    };

    Modebar.prototype.setMode = function ( name ) {
        var index = this.modeName.indexOf( name );
        if ( index > -1 && this.mode !== name ) {
            this.resetMode();
            this.mode = name;
        }
        return index;
    };

    Modebar.prototype.resetMode = function () {
        var index = this.mode === '' ? -1 : this.modeName.indexOf( this.mode );
        if ( index > -1 ) {
            this.modeList[ index ].close()
            this.mode = '';
        }
    };

    return Modebar;

} );
