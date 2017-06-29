var fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('vars.json params', function () {
    var trgFolder = path.resolve('test/tmp'),
        m = malta.get();
    it('the output file should contain right values from vars1.json', function (done) {
        m.check(['#' + trgFolder + '/source/main.js', trgFolder + '/build', '-vars=test/tmp/vars1.json', '-options=verbose:0']).start(function (o){
            fs.readFile(trgFolder + '/build/main.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt + "");
                console.assert(JSON.stringify(env) === '{"name":"production","version":"1.0","full":"production v.1.0"}')
                console.assert(author === 'Federico Ghedina');
                console.assert(env.version === '1.0');
                done();
            });
        });
    });
});