var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('../src/index.js'),
	funcs = require('../src/functions.js'),
	promise = require('promise');

describe('multi destinations', function () {

    it('should output correctly two different files from one tpl with different variables', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/multidestination.json']);
			ls.on('exit', function (code) {
				// check the files
				//
				promise.all([(d) => {
					fs.stat('test/fs/build/d1/multidest.js', function (err, cnt) {
						assert.ok(cnt);
						d();
					});
				}, (d) => {
					fs.stat('test/fs/build/d2/multidest.js', function (err, cnt) {
						assert.ok(cnt);
						d();
					});
				}]).then(() => {
					done();
				});
			});
			ls.stderr.on('data', function(err) {
				assert.ok(false)
			});
		} catch (err) {
			throw err;
		}
	});
	
	it('should remove the folders/files just created', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/multidestinationClear.json']);
			ls.on('close', function (code) {
				assert.equal(malta.executeCheck, code); // 0
				
				fs.stat('test/fs/build/d1', function (err, cnt) {
					assert.ok(err);
					done();
				});
			});
		} catch (err) {
			throw err;
		}
	});

});