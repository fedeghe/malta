const path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    root = path.resolve(folder, '../..'),
    bin = path.join(root, 'src/bin.js'),
    doneFunc = require('../utils').doneFunc;


describe('plugin manager', function () {
    it('should output expected result', function (done) {
        try {
            const ls = child_process.spawn('node', [bin, `${folder}/one.json`], { cwd: root });
            ls.on('error', done);
            ls.on('exit', function (code) {
                if (code !== malta.executeCheck) return done(new Error(`Unexpected exit code: ${code}`));
                fs.readFile(`${folder}/out/test.flat.json`, 'utf8', function (err, cnt) {
                    if (err) return done(err);
                    expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should output expected result - options to plugin', function (done) {
        try {
            const ls = child_process.spawn('node', [bin, `${folder}/oneWithOption.json`], { cwd: root });
            ls.on('error', done);
            ls.on('exit', function (code) {
                if (code !== malta.executeCheck) return done(new Error(`Unexpected exit code: ${code}`));
                fs.readFile(`${folder}/out/test.xxx.json`, 'utf8', function (err, cnt) {
                    if (err) return done(err);
                    expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should output expected result - wildCard - options to plugin', function (done) {
        try {
            const ls = child_process.spawn('node', [bin, `${folder}/wildCardWithOption.json`], { cwd: root });
            ls.on('error', done);
            ls.on('exit', function (code) {
                if (code !== malta.executeCheck) return done(new Error(`Unexpected exit code: ${code}`));
                fs.readFile(`${folder}/out/test.yyy.json`, 'utf8', function (err, cnt) {
                    if (err) return done(err);
                    expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
                    done();
                });
            });
            
        } catch (err) {
            throw err;
        }
    });
    it('should remove the folders/files just created', doneFunc(folder));
});
