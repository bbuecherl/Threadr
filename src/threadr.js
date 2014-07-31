// Threadr-module which is exposed to the global namespace
var Threadr = ( function( ) {
    // list of all threads
    var _threads = [];

    // the exposed Threadr-object
    var Threadr = {

        // spawn a new thread
        // - fn {Function} thread source code
        spawn: function( fn ) {
            return new Thread( fn, _threads );
        },

        // terminate all running threads
        terminateAll: function( ) {
            for( var i = 0; i < _threads.length; ++i ) {
                _threads[i].terminate( );
            }
        },

        // count of currently active threads
        count: 0,

        // url to the runnable.js-file necessary for Threadr
        url: "runnable.js",

        // support flags
        supports: {
            worker: isWorkerSupport,
            websocket: isWebsocketSupport,
            indexeddb: isIndexeddbSupport
        }
    };

    // expose to library scope
    return Threadr;
}( ) );
