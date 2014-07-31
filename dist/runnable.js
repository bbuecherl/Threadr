/**
 * Threadr.js runnable v0.0.1-b1407312225
 * https://github.com/bbuecherl/Threadr
 * by Bernhard Buecherl http://bbuecherl.de/
 * License: MIT http://bbuecherl.mit-license.org/ */
// copy of the event emitter (emitter.js)
var emitter = function( target ) {
    var listeners = {};

    target.on = function( event, listener ) {
        ( listeners[event] = listeners[event] || [] ).push( listener );
        return target;
    };
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

    return function( event, args ) {
        var val = listeners[event] || [],
            key = val.length;

        args = args || [];

        while( key > 0 ){
            val[--key].apply( target, args );
        }
    };
};

// Threadr.js runnable
var ThreadrRunnable = function( source, params, loc, postMessage,
            importScripts, close ) {

        // funny note: using "this." here will make the variables
        // invisible for the usercode
        this.params = [];
        this.applier = [];
        this.childs = [];

        // runnable supports
        this.workerSupport;
        try { this.workerSupport = ( typeof Worker !== "undefined" ); } catch( e ) { this.workerSupport = false; }

        // parse parameters and arguments
        for( var p in params ) {
            this.params.push( p );
            this.applier.push( params[p] );
        }

        // generate a sub-thread id
        this.genId = ( function( ) {
            var id = 0;
            return function( ) {
                return id++;
            };
        }( ) );

        var reference = this;

        // scope for the runnable
        var scope = {
            // post a message to the parent thread
            // - name {String} message identifier
            // - args {Array} list of arguments
            post: function( name, args ) {
                postMessage( {
                    threadr: "post",
                    name: name,
                    args: args
                } );
            },

            // load external scripts
            // - scripts {Array|String} list of js-files
            // - callback {callback} callback function
            load: function( scripts, callback ) {
                importScripts( scripts );
                callback( );
            },

            // terminate the worker
            terminate: function( ) {
                close( );
            },

            // location of the main-thread
            location: loc,

            // shim the Threadr object
            Threadr: {
                // shim the spawn function
                // TODO: use native Workers, when sub workers are supported
                spawn: function( fn ) {
                    // generate id
                    var id = reference.genId( );

                    // spawn the thread
                    postMessage( {
                        threadr: "spawn",
                        source: fn.toString( ),
                        id: id
                    } );

                    // shim object for the thread
                    var thread = {
                        // function to start the thread
                        start: function( ) {
                            postMessage( {
                                threadr: "start",
                                id: id
                            } );
                            return thread;
                        },

                        // terminate
                        terminate: function( ) {
                            postMessage( {
                                threadr: "terminate",
                                id: id
                            } );
                            return thread;
                        },

                        // running flag
                        running: true,

                        // post message
                        post: function( name, args ) {
                            postMessage( {
                                threadr: "suppost",
                                id: id,
                                name: name,
                                args: args
                            } );
                            return thread;
                        }
                    };

                    // add event emitter
                    var e = emitter( thread );

                    // push to child threads
                    reference.childs.push( {
                        id: id,
                        emitter: e,
                        thread: thread
                    } );

                    return thread;
                }
            }
        };

        // register event emitter
        this.emit = emitter( scope );

        // define overrides
        this.overrides = {
            // shortcuts
            post: scope.post,
            on: scope.on,
            off: scope.off,
            load: scope.load,
            Threadr: scope.Threadr,
            terminate: scope.terminate,
            location: scope.location,

            // set scope
            self: scope,
            window: scope,
            reference: undefined,
            scope: undefined,
            emitter: undefined,
            runnable: undefined,
            ThreadrRunnable: undefined,

            // override native functions
            importScripts: undefined,
            close: undefined,
            postMessage: undefined,
            onmessage: undefined,
            onerror: undefined
        };

        // apply overrides
        for( var pa in this.overrides ) {
            if( this.params.indexOf( pa ) === -1 ) {
                this.params.push( pa );
                this.applier.push( this.overrides[pa] );
            }
        }

        // execute function
        var fn = Function.apply( scope, this.params.concat( source ) );
        fn.apply( scope, this.applier );
    },
    runnable;

// register message listener
onmessage = function( evt ) {
    if( evt.data.threadr ) {
        switch( evt.data.threadr ) {
            // start thread
            case "init":
                if( !runnable ) {
                    runnable = new ThreadrRunnable( evt.data.source, evt.data.params,
                            evt.data.loc, postMessage, importScripts, close );
                } //otherwise fail silent
                break;

            // redirect messages from parent to the runnable
            case "post":
                if( runnable ) {
                    runnable.emit( evt.data.name, evt.data.args );
                }
                break;

            // redirect messages from subthread to the runnable
            case "subpost":
                if( runnable && runnable.childs && runnable.childs[evt.data.id] ) {
                    runnable.childs[evt.data.id].emitter( evt.data.name, evt.data.args );
                }
                break;
        }
    }
};

