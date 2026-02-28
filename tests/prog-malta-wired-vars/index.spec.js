const fs = require('fs'),
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
            '-vars=tests/prog-malta-wired-vars/vars1.json',
            '-options=verbose:0'
        ]).start( () => {
            fs.readFile(
                `${folder}/out/wired.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        expect(/\d+:\d+:\d+/.test(`${time}`)).toBe(true);
                        expect(/\d+\/\d+\/\d+/.test(`${date}`)).toBe(true);
                        expect(/\d{4}/.test(`${year}`)).toBe(true);
                        expect(filesnum == 2).toBe(true);
                        expect(version).toBe(malta.version);
                        expect(typeof buildnumber).toBe('string');
                        expect(typeof buildnum).toBe('string');
                        expect(file).toBe('wired.js');
                        expect(line == 9).toBe(true);
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
