var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('../src/index.js');

describe('EXE param in build file', function () {
	it('should add a file named exefile.txt containing "hello world" in test/fs', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/exe/exeadd.json']);
			ls.on('exit', function (code) {
				assert.equal(malta.executeCheck, 0);
				assert.equal(code, 0);
				fs.readFile('test/fs/exefile.txt',  'utf8', function(err, cnt){
					if (err) throw err;
					assert.equal(cnt.split(/\n/)[0], 'hello world')
					done();
				});
			});
		} catch (err) {
			throw err;
		}
	});
	it('should remove the file just created', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/exe/exeremove.json']);
			ls.on('exit', function (code) {
				assert.equal(malta.executeCheck, 0);
				assert.equal(code, 0);
				fs.access('test/fs/exefile.txt', function (err, cnt) {
					assert.ok(err && err.code === 'ENOENT');
					done();
				});
			});
		} catch (err) {
			throw err;
		}
	});

	it('should fail to execute the command set', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/exe/exeallfail.json']);
			ls.on('exit', function (code) {
				assert.notEqual(malta.executeCheck, code);
				done();
			});
		} catch (err) {
			throw err;
		}
	});

	it('should execute successfully all commands', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/exe/exeall.json']);
			ls.on('exit', function (code) {
				assert.equal(malta.executeCheck, 0);
				done();
			});
		} catch (err) {
			throw err;
		}
	});
});