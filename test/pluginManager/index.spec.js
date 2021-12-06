const assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;


describe('plugin manager', function () {
    it('should output expected result', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/one.json`]);
            // ls.stdout.on('data', d => console.log(d.toString()));
            ls.on('exit', function (code) {
                assert.equal(malta.executeCheck, code);
                fs.readFile(`${folder}/out/test.flat.json`, 'utf8', function (err, cnt) {
                    if (err) throw err;
                    assert.equal(cnt, '{"person":{"name":"Federico","surname":"Ghedina"}}')
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should output expected result - options to plugin', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/oneWithOption.json`]);
            ls.on('exit', function (code) {
                assert.equal(malta.executeCheck, code);
                fs.readFile(`${folder}/out/test.xxx.json`, 'utf8', function (err, cnt) {
                    if (err) throw err;
                    assert.equal(cnt, '{"person":{"name":"Federico","surname":"Ghedina"}}')
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should output expected result - wildCard - options to plugin', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/wildCardWithOption.json`]);
            ls.on('exit', function (code) {
                assert.equal(malta.executeCheck, code);
                fs.readFile(`${folder}/out/test.yyy.json`, 'utf8', function (err, cnt) {
                    if (err) throw err;
                    assert.equal(cnt, '{"person":{"name":"Federico","surname":"Ghedina"}}')
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should remove the folders/files just created', doneFunc(folder));
});