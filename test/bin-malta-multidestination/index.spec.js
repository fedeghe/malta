const assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;

describe('multi destinations', function () {

    it('should output correctly two different files from one tpl with different variables', function (done) {
		try {
			const ls = child_process.spawn('node', ['src/bin.js', `${folder}/multidestination.json`]);
			ls.on('exit', function (code) {
				// check the files
				//
				Promise.all([(d) => {
					fs.stat(`${folder}/out/d1/multidest.js`, function (err, cnt) {
						assert.ok(cnt);
						d();
					});
				}, (d) => {
					fs.stat(`${folder}/out/d2/multidest.js`, function (err, cnt) {
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

    it('should remove the folders/files just created', doneFunc(folder));

});