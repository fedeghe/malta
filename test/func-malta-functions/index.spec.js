var assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	functions = require('../../src/functions'),
    folder = path.dirname(__filename);

describe('check subCommands', function () {
	it('-clean works', function (done) {
		// first create a *.buildNum.json
		fs.writeFile(`${folder}/aaa.buildNum.json`, '', function () {
			if (fs.existsSync(`${folder}/aaa.buildNum.json`)) {
				functions.subCommand('-clean') && done();
			}
		});
	});
	it('-clean is the only command', function (done) {
		!functions.subCommand('-unclean') && done();
	});
});