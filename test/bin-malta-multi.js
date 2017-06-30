var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process');



describe('multi nested.json', function () {

    it('should output correctly add files', function (done) {
		try {
			var ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/nested.json']);
			ls.on('exit', function (code) {
				assert.equal(code, 0);
				//check the files
				

				done()
			});
			ls.stderr.on('data', function(err) {
				console.log(err+"")
			});
		} catch (err) {
			throw err;
		}
    });
});

