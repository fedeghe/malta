var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('tpl', function () {
    var m = malta.get();

    it('the output file should have right default values', done => {
        m.check([
            `#${folder}/tpl/tpl0.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-tpl/vars2.json',
            '-options=verbose:0,showPath:false'
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl0.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(typeof tpl0, 'function')
                        assert.equal(tpl0(), 5);
                        assert.equal(typeof tpl1, 'function');
                        assert.equal(typeof tpl2, 'function');
                        done()
                    } catch (e) {
                        done(new Error(`Failed eval on \`${__filename}\``))
                    }
                }
            );
        });
    });

    it('the output file should have right passed values', done => {
        m.check([
            `#${folder}/tpl/tpl1.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-tpl/vars2.json',
            '-options=verbose:0,showPath:false'
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl1.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(typeof tpl0, 'function')
                        assert.equal(tpl0(), 3);
                        assert.equal(typeof tpl1, 'function');
                        assert.equal(typeof tpl2, 'function');
                        done();
                    } catch (e) {
                        done(new Error(`Failed eval on \`${__filename}\``))
                    }
                }
            );
        });
    });

    it('should remove the folders/files just created', doneFunc(folder));
});