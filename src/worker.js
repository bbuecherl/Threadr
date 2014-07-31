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
