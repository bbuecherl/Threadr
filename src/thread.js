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
