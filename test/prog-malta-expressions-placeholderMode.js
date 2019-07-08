var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../src/index.js');

describe('expressions placeholders (placeholderMode: func)', function () {
    var trgFolder = path.resolve('test/fs'),
        m = malta.get();
    it("some expression evaluated vars should contain the expected value", () => {
        m.check(['#' + trgFolder + '/source/expressions/expression_ph.js', trgFolder + '/build', '-vars=test/fs/vars2.json', '-options=verbose:0,placeholderMode:\'func\'']).start(function (o){
            fs.readFile(
                trgFolder + '/build/expression_ph.js',
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    eval(cnt + "");
                    assert.equal(a, 7)
                    assert.equal(b, 7)
                    assert.equal(c, 'just a string')
                    assert.equal(e, 10)
                    assert.equal(d.toFixed(2), '4188.79')
                    assert.equal(parseFloat(sphereVolume.toFixed(2), 10), 4188.79)
                }
            );
        });
    });
});