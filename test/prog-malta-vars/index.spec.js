var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('vars.json params', function () {
    const m = malta.get();

    it('the output file should contain right values from vars1.json', done => {
        m.check([
            `#${folder}/vars/main.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-vars/vars1.json',
            '-options=verbose:0'
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/main.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(JSON.stringify(env), '{"name":"production","version":"1.0","full":"production v.1.0"}')
                        assert.equal(author, 'Federico Ghedina');
                        assert.equal(env.version, '1.0');
                        assert.equal(fromPackageName, 'malta');
                        assert.equal(fromPackageMain, 'src/index.js');
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