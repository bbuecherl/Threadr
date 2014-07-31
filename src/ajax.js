var ajax = function( url, callback, timeout ) {
    var xhr = false;

    var task = window.setTimeout( function( ) {
        callback( null );
        task = false;
        if( xhr )
            xhr.abort( );
    }, timeout || 5000 );

    function exec( url ) {
        xhr = false;

        if ( window.XMLHttpRequest ) { // Chrome, Mozilla, Safari,...
            xhr = new XMLHttpRequest( );
            if ( xhr.overrideMimeType ) {
                xhr.overrideMimeType( "text/json" );
            }
        } else if ( window.ActiveXObject ) { // IE
            try {
                xhr = new ActiveXObject( "Msxml2.XMLHTTP" );
            } catch ( e ) {
                try {
                    xhr = new ActiveXObject( "Microsoft.XMLHTTP" );
                } catch ( ex ) {}
            }
        }

        if ( !xhr )
            return false;

        xhr.onreadystatechange = done;
        xhr.open( "GET", url, true );

        xhr.setRequestHeader( "Content-type", "text/plain" );
        xhr.send( null );
    }

    function done() {
        if( task && xhr.readyState == 4 ) {
            if( xhr.status == 200 ) {
                callback( xhr.responseText );
            } else {
                callback( null );
            }
            window.clearTimeout( task );
        }
    }
    exec( url );
};
