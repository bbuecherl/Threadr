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
