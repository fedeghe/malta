var path = require('path'),
	fs = require('fs'),
	child_process = require('child_process');

describe('Wildcard tpl', function () {
	it('should create one file for each tpl found', function (done) {
		try {
            const ls = child_process.spawn('node', ['src/bin.js', 'test/fs/multi/wildCardFile.json']),
                aFile = 'test/fs/build/wildcard/a.js',
                bFile = 'test/fs/build/wildcard/b.js';
			ls.on('close', function (code) {
                const a = fs.existsSync(aFile),
                    b = fs.existsSync(bFile);
                if(a && b) {
                    fs.unlinkSync(aFile)
                    fs.unlinkSync(bFile)
                    done();
                }
			});
		} catch (err) {
			throw err;
		}
	});
});