var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('src/index.js');

describe('Wildcard tpl', function () {
	it('should create one file for each tpl found', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/wildCardFile.json']);
			ls.on('close', function () {
				assert.equal(malta.executeCheck, 0); // 0
				done();
			});
		} catch (err) {
			throw err;
		}
	});
});