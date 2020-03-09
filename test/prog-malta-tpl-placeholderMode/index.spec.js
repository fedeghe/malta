const assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('tpl (placeholderMode: func)', function () {
    const m = malta.get();

    it('the output file should have right default values (placeholderMode: func)', done => {
        m.check([
            `#${folder}/tpl/tpl0ph.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-tpl-placeholderMode/vars2.json',
            '-options=verbose:0,showPath:false,placeholderMode:\'func\''
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl0ph.js`,
                'utf8',
                (err, cnt) => {
                    try {
                        eval(cnt + "");
                        assert.equal(typeof tpl0, 'function')
                        assert.equal(tpl0(), 15);
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

    it('the output file should have right passed values (placeholderMode: func)', done => {
        m.check([
            `#${folder}/tpl/tpl1ph.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-tpl-placeholderMode/vars2.json',
            '-options=verbose:0,showPath:false,placeholderMode:\'func\''
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl1ph.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        assert.equal(typeof tpl0, 'function')
                        assert.equal(tpl0(), 3);
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

    it('should remove the folders/files just created', doneFunc(folder));
});