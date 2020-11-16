const assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    malta = require('../../src/index.js'),
    child_process = require('child_process'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;


describe('plugin->plugin based', function () {
    const m = malta.get();
    it('should output correctly all files', done => {
        m.check([
            `#${folder}/code/index.js`,
            `${folder}/out`,
            '-plugins=myplugin[name:\"one_plugin_is_working\"]...myplugin2[name:\"v2-another_plugin_is_working\"]',
            '-options=verbose:0',
        ]).start(o => {
            assert(o.content.length)
        }).then((o) => {
            assert(o.content.match(/^\/\/\>\>\sv2-another_plugin_is_working/m))
            assert(o.content.match(/^\/\/\>\sone_plugin_is_working/m))
            done()
        });
    });
    it('should cleanup correctly all files', doneFunc(folder));
});