var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	funcs = require('src/functions.js'),
	malta = require('src/index.js');

describe('multi nested.json', function () {
	it('should output correctly all files', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/nested.json']);
			ls.on('exit', function (code) {
				assert.equal(code, 0);
				//check the files?...not yet
				done();
			});
			ls.stderr.on('data', function(err) {
				assert.ok(false)
			});
		} catch (err) {
			throw err;
		}
	});
});