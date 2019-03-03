var assert = require('assert'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('src/index.js');

describe('EXE nested param in build file', function () {

	it('should create a folder tree starting from a single json that nests some others', function (done) {
		try {
			var ls = child_process.spawn('node',  ['src/bin.js', 'test/fs/nest/exenest0.json']);
			ls.on('close', function (code) {
				assert.equal(malta.executeCheck, code); // 0

				fs.readFile('test/fs/build/nest0/nest1/nest2/file.txt',  'utf8', function(err, cnt){
					if (err) throw err;
					assert.equal(cnt.split(/\n/)[0], 'hello world');
					done();
				});
			});
		} catch (err) {
			throw err;
		}
	});

	it('should remove the file just created', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/nest/exeNestCleanup.json']);
			ls.on('close', function (code) {
				assert.equal(malta.executeCheck, code); // 0
				fs.access('test/fs/build/nest0/nest1/nest3/file.txt', function (err, cnt) {
					assert.ok(err && err.code === 'ENOENT');
					done();
				});
			});
		} catch (err) {
			throw err;
		}
	});
});