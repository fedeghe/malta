var assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	pro = require('../src/maltapromise');

describe('Father ... I promise', function () {
	var trgFolder = path.resolve(path.dirname(__filename) + '/fs/observed');

	it('honour a promise', function (done) {
		var p = new pro(function (_done) {
			setTimeout(function () {
				_done(101);
			});
		});
		p.then(function (res) {
			assert.equal(res, 101);
			done();
		});
	});

	it('fail a promise', function (done) {
		var p = new pro(function (_done, _fail) {
			setTimeout(function () {
				_fail();
			},10);
		}).then().catch(function () {
			done();
		});
	});

	it('reject a promise', function (done) {
		var p = new pro(function (_done, _fail) {
			setTimeout(function () {
				_fail();
			},10);
		}).catch(function () {
			done();
		}).reject();
	});

	// });
});