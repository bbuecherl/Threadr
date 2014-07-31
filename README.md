# Threadr.js #
## Multithreading API for the browsers ##

---
### Note ###
This library is currently under development, thus do not use it in production.
#### Features under development ####
 - core
    - custom exceptions
    - make `while` and `for` non-blocking in shim workers
    - improve sandboxing shim workers
 - websockets
 - indexeddb
 - xhr
 - imagedata

---
### How it works ###
Threadr uses Webworkers when present, otherwise it falls back to a singlethreaded application which still tries to be
non-blocking by making only asynchronous requests. So Threadr will try to find the most performant way to execute your
code that is possible in the users browser, so you don't have to worry about different implementation. Threadr event
lets you use Websockets, IndexedDB, ImageData and spawn sub-threads inside a thread.

---
### Usecases ###
Threadr aims to boost performance whereever it is possible.

**Example**: HTML5 game
Your rendering engine runs on the main thread, while the physics engine and the networking engine run in different
Threadr-threads. Threadr will use multi-threading in browsers that support Webworkers, which means, that physics and
network won't block your rendering, so your rendering can now take up to 16.6ms and still runs smoothly at 60fps.
When the users browser does not support webworkers it will just fallback to a single-threaded application without
requiring you to write multiple code fragments.

---
### Browsersupport ###
Threadr's core engine supports IE8+, Chrome 1+, Firefox 6+, Opera 12.1+, Safari 4+ but will run faster in IE10+,
Chrome 13+, Firefox 8+, Opera 12.1+, Safari 5.1+ since these support Webworkers natively.

Threadr enables you to use Websockets/IndexedDB inside threads which is supported in browsers that support Websockets/IndexedDB.

---
### Usage ###
```
<div id="prime"></div>
<script src="path/to/threadr.js" type="text/javascript"></script>
<script>
//configure threadr
Threadr.config( "path/to/threadr.runnable.js" );

//spawn a thread
var thread = Threadr.spawn( function( ) {
    var n = startAt,
        count = 0;

    setInterval( function( ) { // while( true ) {
        n++;
        for( var i = 2; i <= Math.sqrt(n); i++ ) {
            if( n%i === 0 ) {
                return; // continue;
            }
        }

        post( "prime", [n, ++count] );
    }, 1); // }
} );

// assign event handler
thread.on( "prime", function( n, c ) {
    document.getElementById( "prime" ).textContent = "Latest Prime found: " + n + " (" + c + "nth prime)";
} );

// start thread execution
thread.start( { startAt: 1 } );
</script>
```

---
### Documentation ###
#### Global `Threadr` object ####
This object is available in the main thread and in subthreads

 - **`Threadr.spawn(code)`** returns `Thread`
   Function to create a new Thread-object
    - `code` {`function`} code that will be executed by the thread
 - **`Threadr.url`** *only available on the main thread* {`string`} relative or absolute path to `runnable.js`
 - **`Threadr.count`** {`number`} Count currently active threads
 - **`Threadr.supports`** {`object`}
   Object storing API support information about the current environment (user browser)
    - `workers` {`boolean`} Webworker support
    - `websockets` {`boolean`} Websocket support
    - `indexeddb` {`boolean`} indexedDB support

#### `Thread` object ####
This object is created using `Threadr.spawn()`

 - **`Thread#start(params)`** returns `this`
   Start thread execution
    - `params` {`object`} *optional* parameters to be available to the thread (needs [JSON](http://json.org/) compatiblity)
 - **`Thread#terminate()`** returns `this`
   Kills the thread, terminated threads can not be restarted
 - **`Thread#post(name, args)`** returns `this`
   Function to post a message to the thread, triggering the `name`-event
    - `name` {`string`} event name
    - `args` {`array`} *optional* aruments passed to the event handlers
 - **`Thread#on(name, handler)`** returns `this`
   Function to add a event handler, listening to events coming from the thread
    - `name` {`string`} event name
    - `handler` {`function`} event handler function
 - **`Thread#off(name, handler)`** returns `this`
   Function to remove a previously assigned event handler
    - `name` {`string`} event name
    - `handler` {`function`} event handler function
 - **`Thread#running`** {`boolean`} Check whether the thread is running

#### Threadscope ####
Functions accessable from inside a thread

 - **`load(scripts,callback)`**
   Function to load dependend javascript files
    - `scripts` {`string`|`array`} path or array of paths to javascript files to be loaded.
    - `callback` {`function`} triggered when all files have been loaded
 - **`terminate()`**
   Terminate the thread, terminated threads can not be restarted
 - **`Thread#post(name, args)`** returns `this`
   Function to post a message to the parent thread, triggering the `name`-event
    - `name` {`string`} event name
    - `args` {`array`} *optional* aruments passed to the event handlers
 - **`Thread#on(name, handler)`** returns `this`
   Function to add a event handler, listening to events coming from the parent thread
    - `name` {`string`} event name
    - `handler` {`function`} event handler function
 - **`Thread#off(name, handler)`** returns `this`
   Function to remove a previously assigned event handler
    - `name` {`string`} event name
    - `handler` {`function`} event handler function

Furthermore you have access to the following global functions:
 - `setInterval`
 - `setTimeout`
 - `clearInterval`
 - `clearTimeout`
 - `atob`
 - `btoa`

And of course to `Threadr` to spawn subthreads.

---
### License ###
[MIT](http://bbuecherl.mit-license.org/)
