const child_process = require('child_process'),
    assert = require('assert'),
    malta = require('../src/index')

const doneFunc = folder => done => {
    try {
        const ls = child_process.spawn('node', ['src/bin.js', `${folder}/clean.json`]);
        ls.on('exit', function (code) {
            assert.equal(code, 0);
            assert.equal(malta.executeCheck, code); // 0
            //check the files?...not yet
            done();
        });
        ls.stderr.on('data', function(err) {
            assert.ok(false)
        });
    } catch (err) {
        throw err;
    }
}

module.exports = {
    doneFunc
}