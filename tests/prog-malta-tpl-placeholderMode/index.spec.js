const fs = require('fs'),
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
            '-vars=tests/prog-malta-tpl-placeholderMode/vars2.json',
            '-options=verbose:0,showPath:false,placeholderMode:\'func\''
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl0ph.js`,
                'utf8',
                (err, cnt) => {
                    try {
                        eval(cnt + "");
                        expect(typeof tpl0).toBe('function');
                        expect(tpl0()).toBe(15);
                        expect(typeof tpl1).toBe('function');
                        expect(typeof tpl2).toBe('function');
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
            '-vars=tests/prog-malta-tpl-placeholderMode/vars2.json',
            '-options=verbose:0,showPath:false,placeholderMode:\'func\''
        ]).start(function (o){
            fs.readFile(
                `${folder}/out/tpl1ph.js`,
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    try {
                        eval(cnt + "");
                        expect(typeof tpl0).toBe('function');
                        expect(tpl0()).toBe(3);
                        expect(typeof tpl1).toBe('function');
                        expect(typeof tpl2).toBe('function');
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
