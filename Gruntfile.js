module.exports = function( grunt ) {
    grunt.initConfig( {
        pkg: grunt.file.readJSON( "package.json" ),

        concat: {
            threadr: {
                options: {
                    banner: "/**\n"
                        + " * Threadr.js v<%= pkg.version %>-b<%= grunt.template.today('yymmddHHMM') %>\n"
                        + " * https://github.com/bbuecherl/Threadr\n"
                        + " * by Bernhard Buecherl http://bbuecherl.de/\n"
                        + " * License: MIT http://bbuecherl.mit-license.org/"
                        + " */\n"
                        + "var Threadr = ( function( ) {\n",
                    seperator: "\n",
                    footer: "\n    return Threadr;\n}( ) );\n"
                },
                src: [ "src/intro.js", "src/ajax.js", "src/emitter.js", "src/worker.js", "src/thread.js", "src/threadr.js" ],
                dest: "dist/threadr.js"
            },

            runnable: {
                options: {
                    banner: "/**\n"
                        + " * Threadr.js runnable v<%= pkg.version %>-b<%= grunt.template.today('yymmddHHMM') %>\n"
                        + " * https://github.com/bbuecherl/Threadr\n"
                        + " * by Bernhard Buecherl http://bbuecherl.de/\n"
                        + " * License: MIT http://bbuecherl.mit-license.org/"
                        + " */\n",
                    seperator: "\n",
                    footer: "\n"
                },

                src: [ "src/runnable.js" ],
                dest: "dist/runnable.js"
            }
        },

        jshint: {
            src: [ "dist/threadr.js", "dist/runnable.js" ]
        },

        uglify: {
            threadr: {
                options: {
                    banner: "/**\n"
                        + " * Threadr.js v<%= pkg.version %>-b<%= grunt.template.today('yymmddHHMM') %>\n"
                        + " * https://github.com/bbuecherl/Threadr\n"
                        + " * License: MIT http://bbuecherl.mit-license.org/"
                        + " */\n"
                },

                src: "dist/threadr.js",
                dest: "dist/threadr.min.js"
            },
            runnable: {
                options: {
                    banner: "/**\n"
                        + " * Threadr.js runnable v<%= pkg.version %>-b<%= grunt.template.today('yymmddHHMM') %>\n"
                        + " * https://github.com/bbuecherl/Threadr\n"
                        + " * License: MIT http://bbuecherl.mit-license.org/"
                        + " */\n"
                },

                src: "dist/runnable.js",
                dest: "dist/runnable.min.js"

            }
        }
    } );

    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-concat" );

    grunt.registerTask( "build", [ "concat" ] );
    grunt.registerTask( "release", [ "concat", "uglify" ] );
};
