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

