/**
 * Threadr.js v0.0.1-b1407312225
 * https://github.com/bbuecherl/Threadr
 * by Bernhard Buecherl http://bbuecherl.de/
 * License: MIT http://bbuecherl.mit-license.org/ */
var Threadr = ( function( ) {
// shortcuts
var blockOpen = "{",
    blockClose = "}",
    emptyString = "",
    undef = "undefined",
    typeObj = "object",
    typeStr = "string",
    typeFunct = "function",

// browser supports ( in-depth testing? )
    isWorkerSupport = ( typeof window.Worker !== undef ),
    isWebsocketSupport = ( typeof window.Worker !== undef ),
    isIndexeddbSupport = ( typeof window.indexedDB !== undef );


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

// simple event emitter
// - target {Object} object which on/off will be registered on
var emitter = function( target ) {
    // list of listeners
    var listeners = {};

    // register listeners
    // - event {String} event identifier
    // - listener {Function} event handler
    target.on = function( event, listener ) {
        ( listeners[event] = listeners[event] || [] ).push( listener );
        return target;
    };

    // unregister listeners
    // - event {String} event identifier
    // - listeners {Function} event handler
    target.off = function( event, listener ) {
        var key,
            val = listeners[event] || [];

        if( typeof listener === "function" ) {
            while( ( key = val.indexOf(listener) ) > -1 ) {
                val.splice( key, 1 );
            }
            listeners[event] = val;
        } else {
            listeners[event] = [];
        }
        return target;
    };

    // emit function
    // - event {String} event identifier
    // - args {Array} list of arguments passed to the handlers
    return function( event, args ) {
        var val = listeners[event] || [],
            key = val.length;

        args = args || [];

        while( key > 0 ){
            val[--key].apply( target, args );
        }
    };
};

// Worker shim
var ThreadWorker = ( function( ) {
    // test for Worker support
    if( isWorkerSupport ) {
        // awesome, someone is actually using a modern browser!
        return window.Worker;
    } else {
        // sandboxing ( TODO: are there any improvements? )
        var WorkerSandbox,

        // creates a function scope for a sandbox
        // - target {WorkerSandbox} sandbox
            makeSandboxScope = function( target ) {

                // save native interval/timeout
                var nativeSetI = window.setInterval,
                    nativeSetT = window.setTimeout,

                // array of current tasks
                    intervalTasks = [],
                    timeoutTasks = [],

                // closing flag
                    $closing = false;

                // shim atob & btoa for the worker
                target.atob = window.atob;
                target.btoa = window.btoa;

                // shim setInterval for the worker
                target.setInterval = function( ) {
                    if( $closing ) return;
                    intervalTasks.push( nativeSetI.apply( window, arguments ) );
                };
                // shim setTimeout for the worker
                target.setTimeout = function( ) {
                    if( $closing ) return;
                    timeoutTasks.push( nativeSetT.apply( window, arguments ) );
                };

                // shim clearInterval
                target.clearInterval = function( id ) {
                    var ind = intervalTasks.indexOf( id );
                    if( ind !== -1 ) {
                        window.clearInterval( id );
                        intervalTasks.splice( ind, 1 );
                    }
                };

                // shim clearTimeout
                target.clearTimeout = function( id ) {
                    var ind = timeoutTasks.indexOf( id );
                    if( ind !== -1 ) {
                        window.clearTimeout( id );
                        timeoutTasks.splice( ind, 1 );
                    }
                };

                // shim terminate function
                target.terminate = function( val ) {
                    if( val === "get" ) {
                        return $closing;
                    } else {
                        // terminate by canceling tasks
                        for( var i = 0; i < intervalTasks.length; ++i ) {
                            window.clearInterval( intervalTasks[i] );
                        }
                        for( i = 0; i < timeoutTasks.length; ++i ) {
                            window.clearTimeout( timeoutTasks[i] );
                        }
                        // and suppress messages
                        $closing = true;
                    }
                };

                // load function
                // - scripts {Array|String} js-file names to be loaded
                // - callback {Function} callback function
                target.load = function( scripts, callback ) {
                    // convert to array
                    if( typeof scripts === "string" ) {
                        scripts = [scripts];
                    }

                    // load each script using ajax requests
                    for( var i = 0, len = scripts.length, loaded = 0; i < scripts.length; ++i ) {
                        ajax( scripts[i], function( data ) {
                            try {
                                // TODO: sandbox?
                                // evaluation may break the code
                                eval( data );
                                loaded++;
                            } catch( e ) {
                                target.$threadr__error( e );
                            }
                            if( loaded === len - 1 ) {
                                callback( );
                            }
                        } );
                    }
                };
            };


        // anonymous scope
        ( function() {
            // WorkerSandbox-Module
            WorkerSandbox = function( ) {
                // shim scope functions
                makeSandboxScope( this );

                // function to start the shim worker
                // - source {Function} thread source code
                // - pa {Object} thread parameters
                this.$threadr__init = function( source, pa ) {
                    // set current location
                    this.location = document.location.href;

                    // parameters and arguments passed to the thread
                    var params = [],
                        args = [],

                    // define overrides for sandboxing
                        overrides = {
                            // global overrides
                            window: this,
                            self: this,
                            document: undefined,
                            top: undefined,
                            history: undefined,
                            parent: undefined,
                            frames: undefined,
                            forms: undefined,

                            // input overrides
                            source: undefined,
                            pa: undefined,

                            // worker functions
                            terminate: this.terminate,
                            on: this.on,
                            off: this.off,
                            post: this.post,
                            load: this.load,
                            location: this.location,

                            // shim functions
                            setTimeout: this.setTimeout,
                            setInterval: this.setInterval,
                            clearTimeout: this.clearTimeout,
                            clearInterval: this.clearInterval,
                            atob: this.atob,
                            btoa: this.btoa,

                            // Threadr-object
                            Threadr: Threadr
                        };

                    // parse parameters and arguments
                    for( var p in pa ) {
                        params.push( p );
                        args.push( pa[p] );
                    }
                    // merge with overrides
                    for( p in overrides ) {
                        if( params.indexOf( p ) === -1 ) {
                            params.push( p );
                            args.push( overrides[p] );
                        }
                    }

                    try {
                        // drop it inside a function, so "return" will not break the code
                        var fn = Function.apply( null, params.concat( source ) );
                        fn.apply( this, args );
                    } catch( e ) {
                        this.$threadr__error( e );
                    }
                };
            };
        }( ) );

        // the Worker shim
        return function( ) {
            // create a sandbox
            var sandbox = new WorkerSandbox( ),
                self = this,

            // and an event emitter to the sandbox
                emit = emitter( sandbox );

            // add some final methods to the sandbox
            sandbox.post = function( name, args ) {
                if( typeof self.onmessage === "function" && !sandbox.terminate( "get" ) ) {
                    self.onmessage( { data: { name: name, args: args } } );
                }
            };
            sandbox.$threadr__error = function( err ) {
                if( typeof self.onerror === "function" && !sandbox.terminate( "get" ) ) {
                    self.onerror( err );
                }
            };

            // post messages to the sandbox
            this.postMessage = function( data ) {
                if( !sandbox.terminate( "get" ) ) {
                    if( data.threadr ) {
                        switch( data.threadr ) {
                            default: return;
                        }
                    } else {
                        emit( data.name, data.args );
                    }
                }
            };

            // terminate function reference
            this.terminate = function( ) {
                sandbox.terminate( );
            };
        };
    }
}( ) );

// Thread-Module used to represent a worker on the global context
var Thread = ( function( ) {

    // function to generate a unique id used for threads
    var generateId = ( function( ) {
            var lastId = 0;
            return function( ) {
                return lastId++;
            };
        }( ) ),

    // function to parse a function and return it's source code
        getSource = function( fn, cb ) { // TODO: optimize
            var str = fn.toString( ).split( blockOpen );
            str.shift( );
            str = str.join( blockOpen ).split( blockClose );
            str.pop( );
            return str.join( blockClose );
        };



    // Thread-Module definition
    // - fn {Function} thread source code
    // - list {Array} parent child list
    // - parent {Boolean} private (subthread)
    return function( fn, list, parent ) {

    // private variables
        // use event emitting on the module (provides on/off handles)
        var emit = false,
        // create an worker instance
            worker = new ThreadWorker( Threadr.url ),
        // rereferencing this object (faster than .bind()-polyfill)
            self = this,
        // the threads source code
            source = false;

        // push the object to it's parent childs list
        list.push( this );



    // public properties
        // current worker state
        this.running = false;
        // thread-id
        this.id = generateId( );
        // childs
        this.childs = [];



    // public methods
        // start the thread with the parameter object
        this.start = function( params ) {
            if( !this.running ) {
                this.running = true;
                Threadr.count++;

                // shim worker start
                if( worker.$threadr_init ) {
                    worker.$threadr_init( src,
                        typeof params === typeObj && params !== null ?
                        params : {} );

                // worker start
                } else {
                    // post threadr-init to the worker
                    source = getSource( fn );
                    worker.postMessage( {
                        threadr: "init",
                        source: source,
                        params: typeof params === typeObj && params !== null ?
                            params :
                            {},
                        loc: document.location.href,
                        count: Threadr.count,
                        id: this.id
                    } );
                }
            }
            return this;
        };

        // create a new thread using the same function and parent
        this.clone = function( ) {
            return new Thread( fn, list );
        };

        // terminate the worker and suppress furthur output
        this.terminate = function( ) {
            if( this.running ) {
                worker.terminate( );
                Threadr.count--;
            }
            return this;
        };

        // post a threadr-post message to the worker
        this.post = function( name, args ) {
            if( this.running ) {
                worker.postMessage( {
                    threadr: "post",
                    name: name,
                    args: args
                } );
            }
            return this;
        };


        // emit handle register
        if( parent ) {
            this.emit = function( handler ) {
                emit = handler;
            };
        } else {
            emit = emitter( this );
        }


    // internal listeners
        // listen for messages from the worker
        worker.onmessage = function( evt ) {
            var tmp;

            if( evt.data.threadr ) {
                switch( evt.data.threadr ) {

                // receive a threadr-post message from the worker
                    case "post":
                        emit( evt.data.name, evt.data.args );
                        break;

                // receive a threadr-suppost message from the worker
                    case "suppost":
                        self.childs[evt.data.id].post( evt.data.name, evt.data.args );
                        break;


                // spawn a subthread for the worker (shim)
                    case "spawn":
                        var id = self.childs.length;
                        tmp = new Thread( evt.data.source, self.childs, true );
                        worker.postMessage( {
                            threadr: "spawned",
                            id: id,
                            tid: tmp.TID
                        } );
                        tmp.emit( function( name, args ) {
                            worker.postMessage( {
                                threadr: "subpost",
                                id: id,
                                name: name,
                                args: args
                            } );
                        } );
                        self.childs.push( tmp );
                        break;

                // start a subthread for the worker (shim)
                    case "start":
                        if( self.childs[evt.data.id] instanceof Thread ) {
                            self.childs[evt.data.id].start( evt.data.params );
                        }
                        break;
                }
            }
        };

        // listen for errors and post them to the thread error listener
        worker.onerror = function( evt ) {
            emit( "error", [evt] );
        };
    };
}( ) );

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

    return Threadr;
}( ) );
