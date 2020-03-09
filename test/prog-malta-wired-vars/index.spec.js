const assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);


describe('wired vars', function () {
    const m = malta.get();
    it('the output file should contain right values from wired values', done => {
        m.check([
            `#${folder}/wired.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-wired-vars/vars1.json',
            '-options=verbose:0'
        ]).start( () => {
            fs.readFile(
                `${folder}/out/wired.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(/\d+:\d+:\d+/.test(`${time}`), true);
                        assert.equal(/\d+\/\d+\/\d+/.test(`${date}`), true);
                        assert.equal(/\d{4}/.test(`${year}`), true);
                        assert.equal(filesnum, 2)
                        assert.equal(version, malta.version);
                        assert.equal(typeof buildnumber, 'string');
                        assert.equal(file, 'wired.js');
                        assert.equal(line, 8);
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