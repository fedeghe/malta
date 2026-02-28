const fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('vars.json params (placeholderMode: func)', () => {
    const m = malta.get();
    it('the output file should contain right values from vars1.json (placeholderMode: func)', done => {
        m.check([
            `#${folder}/vars/mainFunc.js`,
            `${folder}/out`,
            '-vars=tests/prog-malta-vars-placeholderMode/vars1.json',
            '-options=verbose:0,placeholderMode:\'func\''
        ]).start(() => {
            fs.readFile(
                `${folder}/out/mainFunc.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        expect(JSON.stringify(env)).toBe('{"name":"production","version":"1.0","full":"production v.1.0"}');
                        expect(author).toBe('Federico Ghedina');
                        expect(env.version).toBe('1.0');
                        expect(fromPackageName).toBe('malta');
                        expect(fromPackageMain).toBe('src/index.js');
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
