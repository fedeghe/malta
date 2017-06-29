var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('malta');

describe('expressions placeholders', function () {
    var trgFolder = path.resolve('test/tmp'),
        m = malta.get();
    it("some expression evaluated vars should contain the expected value", function (done) {
        m.check(['#' + trgFolder + '/source/expression.js', trgFolder + '/build', '-vars=test/tmp/vars2.json', '-options=verbose:0']).start(function (o){
            fs.readFile(trgFolder + '/build/expression.js', function (err, cnt) {
                if (err) throw err;
                eval(cnt + "");
                assert.equal(a, 7)
                assert.equal(b, 7)
                assert.equal(c, 'just a string')
                assert.equal(parseFloat(sphereVolume.toFixed(2), 10), 4188.79)
                done();
            });
        });
    });
});