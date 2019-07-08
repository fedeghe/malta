var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');


describe('wired vars', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();
    it('the output file should contain right values from wired values', function (done) {
        m.check(['#' + trgFolder + '/source/vars/wired.js', trgFolder + '/build', '-vars=test/fs/vars1.json', '-options=verbose:0']).start(function (o){
            fs.readFile(trgFolder + '/build/wired.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt + "");
                assert.equal(/\d+:\d+:\d+/.test(`${time}`), true);
                assert.equal(/\d+\/\d+\/\d+/.test(`${date}`), true);
                assert.equal(/\d{4}/.test(`${year}`), true);
            
                
                assert.equal(filesnum, 2)
                assert.equal(version, malta.version);
                assert.equal(buildnumber, 1);
                assert.equal(file, 'wired.js');
                assert.equal(line, 8);
                done();
            });
        });
    });
});