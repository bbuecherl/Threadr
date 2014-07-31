var coreThread = function( ) {
    var threadFn = function( ) {
        setInterval( function( ) {
            post( "ns", [start] );
        }, 1 );

        on( "receive", function( tmp ) {
            post( "received", [tmp] );
        } );
    };
    var thread;
    var start = Math.random( );

    it( "Thread#start()", function( ) {
        thread = Threadr.spawn( threadFn );
        thread.start( { start: start } );

        expect( Threadr.count ).to.be.equal( 1 );
    } );

    it( "Thread#on() and Thread#off()", function( done ) {
        var tmp = function( s ) {
            expect( s ).to.be.equal( start );
            thread.off( "ns", tmp );
            done( );
        };

        thread.on( "ns", tmp );
    } );

    it( "Thread#post()", function( done ) {
        var tmp = Math.random( );
        thread.on( "received", function( v ) {
            expect( v ).to.be.equal( tmp );
            done( );
        } );

        thread.post( "receive", [tmp] );
    } );

    it( "Thread#running", function( ) {
        expect( thread.running ).to.be.true;
    } );

    it( "Thread#id", function( ) {
        expect( thread.id ).to.be.equal( 1 );
        // 1 since we started a thread (0)
        // earlier in core/threadr.js
    } );

    it( "Thread#terminate()", function( done ) {
        var t = { fn: function( ) { } };
        var tmp = sinon.sandbox.create( ).stub( t, "fn" );

        thread.terminate( );
        thread.on( "ns", t.fn );
        setTimeout( function( ) {
            sinon.assert.notCalled( t.fn );
            done( );
        }, 200 );
    } );
};
