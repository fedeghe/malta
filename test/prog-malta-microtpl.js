const assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('microtpl', function () {
    const trgFolder = path.resolve('test/fs'),
        m = malta.get();
    it('the output file should have right content', function (done) {
        m.check(['#' + trgFolder + '/source/mtpl/mtpl.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/mtpl.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt+"");
                assert.equal(typeof tpl0, 'function');
                assert.equal(typeof tpl1, 'undefined');
                assert.equal(typeof tpl2, 'function');
                done();
            });
        });
    });
});