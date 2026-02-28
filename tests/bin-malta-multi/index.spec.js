const path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;


describe('multi nested.json', function () {
	it('should output correctly all files', function (done) {
		try {
			const ls = child_process.spawn('node', ['src/bin.js', `${folder}/nested.json`]);
			ls.on('exit', function (code) {
				expect(code).toBe(0);
				//check the files?...not yet
				done();
			});
			ls.stderr.on('data', function(err) {
				expect(false).toBe(true);
			});
		} catch (err) {
			throw err;
		}
    });
    it('should cleanup correctly all files', doneFunc(folder));
});
