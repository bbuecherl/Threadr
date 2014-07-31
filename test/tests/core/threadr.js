var coreThreadr = function( ) {
    var tmp;

    it( "Threadr.url", function( ) {
        expect( Threadr.url ).to.be.equal( "runnable.js" );
        Threadr.url = "../src/runnable.js";
        expect( Threadr.url ).to.be.equal( "../src/runnable.js" );
    } );

    it( "Threadr.count", function( ) {
        expect( Threadr.count ).to.be.equal( 0 );
    } );

    it( "Threadr.supports", function( ) {
        expect( Threadr.supports.worker ).to.be.equal( typeof window.Worker !== "undefined" );
        expect( Threadr.supports.websocket ).to.be.equal( typeof window.WebSocket !== "undefined" );
        expect( Threadr.supports.indexeddb ).to.be.equal( typeof window.indexedDB !== "undefined" );
    } );

    it( "Threadr.spawn()", function( ) {
        tmp = Threadr.spawn( function( ) {

        } );
        expect( tmp.start ).to.be.instanceOf( Function );
        expect( tmp.terminate ).to.be.instanceOf( Function );
        expect( tmp.post ).to.be.instanceOf( Function );
        expect( tmp.on ).to.be.instanceOf( Function );
        expect( tmp.off ).to.be.instanceOf( Function );
    } );
};
