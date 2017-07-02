var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	malta = require('../src/index.js');

describe('utilty functions', function () {
	m = malta.get();

	it('createEntry', function () {
		try {
			var entry = m.utils.createEntry('test/fs/vars1.json');
			assert.ok(entry.content.length > 0)
			assert.ok(entry.time > 0)
			assert.ok(entry.cachevalid)
		} catch (err) {
			throw err;
		}
	});

	it('getFileExtension', function () {
		try {
			var ext1 = m.utils.getFileExtension('test/fs/vars1.json'),
				ext2 = m.utils.getFileExtension('test/fs/vars1.java'),
				ext3 = m.utils.getFileExtension('test/fs/vars1.cpp');

			assert.equal(ext1, 'json')
			assert.equal(ext2, 'java')
			assert.equal(ext3, 'cpp')
		} catch (err) {
			throw err;
		}
	});

	it('getFileTime', function () {
		try {
			var ext1 = m.utils.getFileTime('test/fs/vars1.json'),
				ext2 = m.utils.getFileTime('test/fs/vars2.json');

			assert.equal(typeof ext1, 'number')
			assert.equal(typeof ext2, 'number')
		} catch (err) {
			throw err;
		}
	});

	it('uniquearr', function () {
		try {
			var arr1 = m.utils.uniquearr([1,2,3,4,1,2,3,4,5]),
				arr2 = m.utils.uniquearr(['a','b','c','a','d','d','e','f','g','f','a']);

			assert.equal(arr1.length, 5)
			assert.equal(JSON.stringify(arr1), JSON.stringify([1,2,3,4,5]));
			assert.equal(arr2.length, 7);
			assert.equal(JSON.stringify(arr2), JSON.stringify(['a','b','c','d','e','f','g']));
		} catch (err) {
			throw err;
		}
	});

	it('solveJson', function () {
		try {
			var trans1 = m.utils.solveJson({
					name : "malta",
					version : "unknown",
					full : "$name$ v.$version$"
				}),
				trans2 = m.utils.solveJson({
					a : "a",
					_ : {
						b : "b",
						_ : {
							c : "c",
							_ : {
								d : "d"
							}
						}
					},
					full : "$a$$_.b$$_._.c$$_._._.d$"
				});
			assert.equal(JSON.stringify(trans1), JSON.stringify({"name":"malta","version":"unknown","full":"malta v.unknown"}));
			assert.equal(JSON.stringify(trans2), JSON.stringify({"a":"a","_":{"b":"b","_":{"c":"c","_":{"d":"d"}}},"full":"abcd"}));
		} catch (err) {
			throw err;
		}
	});

});