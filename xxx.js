var less = require( 'less' );
var fs = require( 'fs' );
var path = require('path');

var basePath = __dirname + '/..';

var lessPath    = basePath + '/test/src/xxx.less',
    outputPath  = basePath + '/test/src/xxx.css';
fs.readFile( lessPath ,function(error,data){
    console.log(error)
    data = data.toString();
    less.render(data, function (e, css) {
        fs.writeFile( outputPath, css, function(err){
            if( err ){
                console.log(err );
            }
            console.log('done');
        });
    });
});