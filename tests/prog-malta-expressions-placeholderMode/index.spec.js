const fs = require('fs'),
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
            `-vars=tests/prog-malta-expressions/vars2.json`,
            '-options=verbose:0,placeholderMode:\'func\''
        ]).start(() => {
            fs.readFile(
                `${folder}/out/expression_ph.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        expect(a).toBe(7);
                        expect(b).toBe(7);
                        expect(c).toBe('just a string');
                        expect(parseFloat(sphereVolume.toFixed(2), 10)).toBe(4188.79);
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
