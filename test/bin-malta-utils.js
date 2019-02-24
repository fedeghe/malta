var assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	utils = require('./../src/utils.js'),
	malta = require('../src/index.js');

describe('utilty functions', function () {
	m = malta.get();

	it('createEntry', function () {
		try {
			var entry = utils.createEntry('test/fs/vars1.json');

			assert.ok(entry.content.length > 0)
			assert.ok(entry.time > 0)
			assert.ok(entry.cachevalid)
		} catch (err) {
			throw err;
		}
	});

	it('getFileExtension', function () {
		try {
			assert.equal(
				utils.getFileExtension('test/fs/vars1.json'),
				'json'
			)
			assert.equal(
				utils.getFileExtension('test/fs/vars1.java'),
				'java'
			)
			assert.equal(
				utils.getFileExtension('test/fs/vars1.cpp'),
				'cpp'
			)
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
			
			assert.equal(arr1.length, 5);
			assert.equal(
				JSON.stringify(arr1),
				JSON.stringify([1,2,3,4,5])
			);
			assert.equal(arr2.length, 7);
			assert.equal(
				JSON.stringify(arr2),
				JSON.stringify(['a','b','c','d','e','f','g'])
			);
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
			assert.equal(
				JSON.stringify(trans1),
				JSON.stringify({"name":"malta","version":"unknown","full":"malta v.unknown"})
			);
			assert.equal(
				JSON.stringify(trans2),
				JSON.stringify({"a":"a","_":{"b":"b","_":{"c":"c","_":{"d":"d"}}},"full":"abcd"})
			);
		} catch (err) {
			throw err;
		}
		try {
			var trans2 = m.utils.solveJson({
				a: "a",
				_: {
					b: "b",
					_: {
						c: "c",
						_: {
							d: "d"
						}
					}
				},
				full: "$a$$_.b$$_._.c$$_._._.d$"
			}, 2);
		} catch(e){
			assert.equal(e instanceof Error, true);
		}
	});

	it('validateJson', () => {
		const f1 = utils.validateJson('{s:1}'),
			f2 = utils.validateJson('{"s":1}');
		assert.equal(f1, false);
		assert.equal(f2, true);
	});

	it('isArray', () => {
		const benchs = [{
			in : {},
			out: false
		}, {
			in: 'str',
			out: false
		}, {
			in: false,
			out: false
		}, {
			in: true,
			out: false
		}, {
			in: [],
			out: true
		}];
		benchs.forEach(bench => {
			assert.equal(utils.isArray(bench.in), bench.out);
		});
	});
	it('isString', () => {
		const benchs = [{
			in: new String('foo'),
			out: true
		}, {
			in: 'foo',
			out: true
		}, {
			in: false,
			out: false
		}, {
			in: true,
			out: false
		}, {
			in: [],
			out: false
		}];
		benchs.forEach(bench => {
			assert.equal(utils.isString(bench.in), bench.out);
		});
	});

	it('getIterator', () => {
		const it = utils.getIterator([1,2,3]);
		assert.equal(it.size(), 3);
		assert.equal(it.hasNext(), true);
		assert.equal(it.next(), 1);
		assert.equal(it.hasNext(), true);
		assert.equal(it.next(), 2);
		assert.equal(it.hasNext(), true);
		assert.equal(it.next(), 3);
		assert.equal(it.hasNext(), false);
		assert.equal(it.size(), 3);
		it.reset();
		assert.equal(it.hasNext(), true);
	});

	describe('jsonFromStr', () => {
		const benchs = [{
			label: 'all good',
			in: 'a:1,b:2,c:3,d:{a:11}',
			out: {a: 1, b: 2, c: 3, d: {a: 11}}
		}, {
			label: 'all good deep',
			in: 'a:{a:{a:{a:{a:{a:{a:{a:{a:1}}}}}}}}',
			out: {a:{a:{a:{a:{a:{a:{a:{a:{a:1}}}}}}}}}
		}, {
			label: 'nothing passed returns false',
			//in: 'a:{a:{a:{a:{a:{a:{a:{a:{a:1}}}}}}}}',
			out: false
		}, {
			label: 'invalid passed returns {}',
			in: 'a:{a=1}',
			out: {}
		}];

		benchs.forEach(bench => 
			it(bench.label, () => {
				assert.equal(
					JSON.stringify(utils.jsonFromStr(bench.in)),
					JSON.stringify(bench.out)
				);
			})
		);
	})

	describe('replaceAll', () => {
		const benchs = [{
			label : 'one replace',
			in: [
				'ciao %name%',
				{ name: 'Federico' }
			],
			out: 'ciao Federico'
		}, {
			label: 'one replace, different delimiters',
			in: [
				'ciao ^name$',
				{ name: 'Federico' },
				{ delim: ['^', '$']}
			],
			out: 'ciao Federico'
		}, {
				label: 'one replace, again different delimiters',
			in: [
				'ciao _name- f.g. _nome-',
				{ name: 'Federico' },
				{ delim: ['_', '-'] }
			],
			out: 'ciao Federico f.g. _nome-'
		}, {
			label: 'nested replacement',
			in: [
				'ciao %name%',
				{ name: '%surname%', surname: 'Ghedina' }
			],
			out: 'ciao Ghedina'
		}, {
			label: 'use a obj generic transformer',
			in: [
				'ciao %name% hello %Federico%',
				s => s.toUpperCase()
			],
			out: 'ciao NAME hello FEDERICO'
		}, {
			label: 'use a obj specific transformer',
			in: [
				'ciao %name% hello %Federico%',
				{
					name: 'Federico',
					Federico: n => n.toUpperCase()
				}
			],
			out: 'ciao Federico hello FEDERICO'
		}, {
			label: 'a inner obj generate empty string',
			in: [
				'ciao %name% hello %Federico%!',
				{
					name: 'Federico',
					Federico: {}
				}
			],
			out: 'ciao Federico hello !'
		}, {
			label: 'namespaced placeholder is a value',
			in: [
				'ciao %person.name% hello!',
				{
					person: {
						name: 'Federico'
					}
				}
			],
			out: 'ciao Federico hello!'
		}, {
			label: 'namespaced placeholder is a function',
			in: [
				'ciao %person.name% hello!',
				{
					person: {
						name: a => a.toUpperCase()
					}
				}
			],
			out: 'ciao PERSON.NAME hello!'
		}, {
			label: 'use fallback function',
			in: [
				'ciao %Person.Name% hello!',
				{
					person: {
						name: a => a.toUpperCase()
					}
				},{
					fb: a => a.toLowerCase()
				}
			],
			out: 'ciao person.name hello!'
		}];
		benchs.forEach(bench => {
			it (bench.label, () => {
				assert.equal(utils.replaceAll(...bench.in), bench.out)
			})
		});
	});


	describe('check namespaces', () => {
		const ns = {
			a: {
				b: {
					c: 1
				}
			},
			s: 'hello'
		};
		const benchs = [{
			label: 'straight in the ns',
			in: ['a', ns],
			out: { b: {c : 1}}
		}, {
			label: 'straight in the first level native',
			in: ['s', ns],
			out: 'hello'
		}, {
			label: 'empty ns => ctx',
			in: ['', ns],
			out: ns
		}, {
			label: 'not found => undefined',
			in: ['hello', ns],
			out: undefined
		}];

		benchs.forEach(bench =>
			it(bench.label, () => {
				assert.equal(
					JSON.stringify(utils.checkns.apply(null, bench.in)),
					JSON.stringify(bench.out)
				);
			})
		);
	});

	it('replaceLinenumbers', () => {
		const tpl = `number one
__LINE__ number two
__LINE__
number four`,
			res = utils.replaceLinenumbers(tpl).split("\n");
		assert.equal(res.length, 4);
		assert.equal(/^2/.test(res[1]), true);
		assert.equal(/^3/.test(res[2]), true);
	});

});
