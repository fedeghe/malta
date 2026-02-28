const path = require('path'),
    fs = require('fs'),
    malta = require('../../src/index.js'),
    child_process = require('child_process'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;


describe('plugin base', function () {
    const m = malta.get();
    it('should output correctly all files', done => {
        m.check([
            `#${folder}/code/pluginme.js`,
            `${folder}/out`,
            '-plugins=myplugin[name:\"plugin_is_working\"]',
            '-options=verbose:0',
        ]).start(o => {
            expect(o.content.length).toBeGreaterThan(0);
        }).then((o) => {
            expect(o.content.match(/^\/\/\splugin_is_working/)).toBeTruthy();
            done()
        });
    });
    it('should cleanup correctly all files', doneFunc(folder));
});
