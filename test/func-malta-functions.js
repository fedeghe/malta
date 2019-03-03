const assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	functions = require('src/functions');

describe('check subCommands', function () {
	var trgFolder = path.resolve(path.dirname(__filename) + '/fs');
	it('-clean works', function (done) {
		// first create a *.buildNum.json
		fs.writeFile(trgFolder + '/aaa.buildNum.json', '', function () {
			if (fs.existsSync(trgFolder + '/aaa.buildNum.json')) {
				var res = functions.subCommand('-clean');
				assert.equal(res, true);
			}
			done();
		});
	});
	it('-clean is the only command', function (done) {
		!functions.subCommand('-unclean') && done();
	});
});