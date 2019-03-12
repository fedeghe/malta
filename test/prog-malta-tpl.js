var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('tpl', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();

    it('the output file should have right default values', () => {
        m.check(['#' + trgFolder + '/source/tpl/tpl0.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/tpl0.js', (err, cnt) => {
                if (err) throw err;
                eval(cnt+"");
                assert.equal(typeof tpl0, 'function')
                assert.equal(tpl0(), 5);
                assert.equal(typeof tpl1, 'function');
                assert.equal(typeof tpl2, 'function');
            });
        });
    });

    it('the output file should have right passed values', () => {
        m.check(['#' + trgFolder + '/source/tpl/tpl1.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/tpl1.js', (err, cnt) => {
                if (err) throw err;
                eval(cnt+"");
                assert.equal(typeof tpl0, 'function')
                assert.equal(tpl0(), 3);
                assert.equal(typeof tpl1, 'function');
                assert.equal(typeof tpl2, 'function');
            });
        });
    });
});