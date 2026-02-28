const path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;

describe('EXE param in build file', function () {
    it(`should create a file ${folder}/exefile.txt containing "hello world"`, function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/add.json`]);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                fs.readFile(`${folder}/exefile.txt`, 'utf8', function (err, cnt) {
                    if (err) throw err;
                    expect(cnt.split(/\n/)[0]).toBe('hello world');
                    done();
                });
            });
        } catch (err) {
            throw err;
        }
    });

    it('should remove the file just created', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/remove.json`]);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                fs.access(`${folder}/exefile.txt`, function (err, cnt) {
                    expect(err && err.code === 'ENOENT').toBe(true);
                    done();
                });
            });
        } catch (err) {
            throw err;
        }
    });

    it('should fail to execute the command set', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/allfail.json`]);
            ls.on('close', function (code) {
                expect(code).not.toBe(malta.executeCheck); // 0
                done();
            });
        } catch (err) {
            throw err;
        }
    });

    it('should execute successfully all commands', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/all.json`]);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                done();
            });
        } catch (err) {
            throw err;
        }
    });

    it('should not execute anything', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/zero.json`]);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                done();
            });
        } catch (err) {
            throw err;
        }
    });

    it('should execute successfully one command', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/json/one.json`]);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                done();
            });
        } catch (err) {
            throw err;
        }
    });
    it('should execute command ', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', '-clean']);
            ls.on('close', function (code) {
                expect(code).toBe(malta.executeCheck); // 0
                done();
            });
        } catch (err) {
            throw err;
        }
    });

    it('should close', function (done) {
        const ls = child_process.spawn('node', ['src/bin.js']);
        ls.on('close', function (code) {
            done();
        });
    });

    it('should skip and undemon', function (done) {
        const ls = child_process.spawn('node', ['src/bin.js', 'json/skip.json']);
        ls.on('close', function (code) {
            done();
        });
    });
    
    it('should handle multidest', function (done) {
        const ls = child_process.spawn('node', ['src/bin.js', 'json/multi.json']);
        ls.on('close', function (code) {
            done();
        });
    });

    it('should remove the file just created', doneFunc(folder));

});
