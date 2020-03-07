const assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    doneFunc = require('../utils').doneFunc,
    folder = path.dirname(__filename);

describe('microtpl', function () {
    const m = malta.get();
    it('the output file should have right content', () => {
        m.check([
            `#${folder}/mtpl/mtpl.js`,
            `${folder}/out`,
            '-vars=test/prog-malta-microtpl/vars2.json',
            '-options=verbose:0,showPath:false'
        ]).start(function (o){
            fs.readFile(
                folder + '/out/mtpl.js',
                'utf8',
                (err, cnt) => {
                    if (err) throw err;
                    eval(cnt+"");
                    assert.equal(typeof tpl0, 'function');
                    assert.equal(typeof tpl1, 'undefined');
                    assert.equal(typeof tpl2, 'function');
                }
            );
        });
    });
    it('should remove the folders/files just created', doneFunc(folder));
});