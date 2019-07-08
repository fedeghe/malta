var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('vars.json params (placeholderMode: func)', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();
    it('the output file should contain right values from vars1.json (placeholderMode: func)', function (done) {
        m.check(['#' + trgFolder + '/source/vars/mainFunc.js', trgFolder + '/build', '-vars=test/fs/vars1.json', '-options=verbose:0,placeholderMode:\'func\'']).start(function (o){
            fs.readFile(trgFolder + '/build/mainFunc.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt + "");
                assert.equal(JSON.stringify(env), '{"name":"production","version":"1.0","full":"production v.1.0"}')
                assert.equal(author, 'Federico Ghedina');
                assert.equal(env.version, '1.0');
                assert.equal(fromPackageName, 'malta');
                assert.equal(fromPackageMain, 'src/index.js');
                done();
            });
        });
        
    });

});