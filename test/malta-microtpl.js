var fs = require('fs'),
    path = require('path'),
    malta = require('malta');

describe('microtpl', function () {
    var trgFolder = path.resolve('test/tmp'),
        m = malta.get();
    it('the output file should have right content', function (done) {
        m.check(['#' + trgFolder + '/source/mtpl.js', trgFolder + '/build', '-vars=test/tmp/vars2.json', '-options=verbose:0,showPath:false']).start(function (o){
            fs.readFile(trgFolder + '/build/mtpl.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt+"");
                console.assert(typeof tpl0 == 'function');
                console.assert(typeof tpl1 == 'undefined');
                console.assert(typeof tpl2 == 'function');
                done();
            });
        });
    });
});