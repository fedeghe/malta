var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('tpl', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();

    it('the output file should have right default values', function (done) {
        m.check(['#' + trgFolder + '/source/tpl/tpl0.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/tpl0.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt+"");
                console.assert(typeof tpl0 == 'function' && tpl0() == 5);
                console.assert(typeof tpl1 == 'function');
                console.assert(typeof tpl2 == 'function');
                done();
            });
        });
    });

    it('the output file should have right passed values', function (done) {
        m.check(['#' + trgFolder + '/source/tpl/tpl1.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/tpl1.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt+"");
                console.assert(typeof tpl0 == 'function' && tpl0() == 3);
                console.assert(typeof tpl1 == 'function');
                console.assert(typeof tpl2 == 'function');
                done();
            });
        });
    });
});