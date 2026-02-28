const fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;

describe('expressions placeholders', () => {
    const m = malta.get();
    it("some expression evaluated vars should contain the expected value", done => {
        m.check([
            `#${folder}/expression.js`,
            `${folder}/out`,
            `-vars=tests/prog-malta-expressions/vars2.json`,
            '-options=verbose:0'
        ]).start(() => {
            fs.readFile(
                `${folder}/out/expression.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        expect(a).toBe(7);
                        expect(b).toBe(7);
                        expect(c).toBe('just a string');
                        expect(parseFloat(sphereVolume.toFixed(2), 10)).toBe(4188.79);
                        done()
                    } catch (e) {
                        done(new Error(`Failed eval on \`${__filename}\``))
                    }
                }
            );
        });
    });
    it('should remove the folders/files just created', doneFunc(folder));
});
