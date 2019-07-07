var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('tpl, func placeholderMode', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();

    // it('the output file should have right default values, func placeholderMode', () => {
    //     m.check(['#' + trgFolder + '/source/tpl/tpl0ph.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false,placeholderMode:\'func\'']).start(function (o){
    //         fs.readFile(trgFolder + '/build/tpl0ph.js', (err, cnt) => {
    //             if (err) throw err;
    //             eval(cnt+"");
    //             assert.equal(typeof tpl0, 'function')
    //             assert.equal(tpl0(), 5);
    //             assert.equal(typeof tpl1, 'function');
    //             assert.equal(typeof tpl2, 'function');
    //         });
    //     });
    // });

    it('the output file should have right passed values, func placeholderMode again', () => {
        m.check(['#' + trgFolder + '/source/tpl/tpl1ph.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,showPath:false,placeholderMode:\'func\'']).start(function (o){
            fs.readFile(trgFolder + '/build/tpl1ph.js', (err, cnt) => {
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