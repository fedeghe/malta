var path = require('path'),
	fs = require('fs'),
    child_process = require('child_process'),
    assert = require('assert'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;

describe('Wildcard tpl', function () {
	it('should create one file for each tpl found', function (done) {
		try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/wildCardFile.json`]),
                aFile = `${folder}/out//a.js`,
                bFile = `${folder}/out/b.js`;
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
    // it('should remove the folders/files just created', function (done) {
    //     try {
	// 		var ls = child_process.spawn('node', ['src/bin.js', `${folder}/clean.json`]);
	// 		ls.on('exit', function (code) {
	// 			assert.equal(code, 0);
	// 			//check the files?...not yet
	// 			done();
	// 		});
	// 		ls.stderr.on('data', function(err) {
	// 			assert.ok(false)
	// 		});
	// 	} catch (err) {
	// 		throw err;
	// 	}
    // });
    it('should remove the folders/files just created', doneFunc(folder));
});