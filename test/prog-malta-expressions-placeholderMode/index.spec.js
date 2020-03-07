var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('expressions placeholders (placeholderMode: func)', () => {
    const m = malta.get();
    it("some expression evaluated vars should contain the expected value", done => {
        m.check([
            `#${folder}/expression_ph.js`,
            `${folder}/out`,
            `-vars=test/prog-malta-expressions/vars2.json`,
            '-options=verbose:0,placeholderMode:\'func\''
        ]).start(() => {
            fs.readFile(
                `${folder}/out/expression_ph.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(a, 7)
                        assert.equal(b, 7)
                        assert.equal(c, 'just a string')
                        assert.equal(parseFloat(sphereVolume.toFixed(2), 10), 4188.79)
                        done();
                    } catch (e) {
                        done(new Error(`Failed eval on \`${__filename}\``));
                    }
                }
            );
        });
    });

    it('should remove the folders/files just created', doneFunc(folder));
});