const path = require('path'),
	fs = require('fs'),
	child_process = require('child_process'),
	utils = require('../../src/utils.js'),
	malta = require('../../src/index.js'),
    folder = path.dirname(__filename);

describe('utilty functions', function () {
	m = malta.get();

	it('createEntry', function () {
		try {
			const entry = utils.createEntry(`${folder}/vars1.json`);
			expect(entry.content.length).toBeGreaterThan(0);
			expect(entry.time).toBeGreaterThan(0);
			expect(entry.cachevalid).toBeTruthy();
		} catch (err) {
			throw err;
		}
	});

	it('getFileExtension', function () {
		try {
			expect(
				utils.getFileExtension('tests/vars1.json'),
			).toBe('json');
			expect(
				utils.getFileExtension('tests/vars1.java'),
			).toBe('java');
			expect(
				utils.getFileExtension('tests/vars1.cpp'),
			).toBe('cpp');
		} catch (err) {
			throw err;
		}
	});

	it('getFileTime', function () {
		try {
			const ext1 = m.utils.getFileTime(`${folder}/vars1.json`),
				ext2 = m.utils.getFileTime(`${folder}/vars2.json`);

			expect(typeof ext1).toBe('number');
			expect(typeof ext2).toBe('number');
		} catch (err) {
			throw err;
		}
	});

	it('uniquearr', function () {
		try {
			const arr1 = m.utils.uniquearr([1,2,3,4,1,2,3,4,5]),
				arr2 = m.utils.uniquearr(['a','b','c','a','d','d','e','f','g','f','a']);
			
			expect(arr1.length).toBe(5);
			expect(
				JSON.stringify(arr1),
			).toBe(JSON.stringify([1,2,3,4,5]));
			expect(arr2.length).toBe(7);
			expect(
				JSON.stringify(arr2),
			).toBe(JSON.stringify(['a','b','c','d','e','f','g']));
		} catch (err) {
			throw err;
		}
	});

	it('solveJson', function () {
		try {
			const trans1 = m.utils.solveJson({
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
			expect(
				JSON.stringify(trans1),
			).toBe(JSON.stringify({"name":"malta","version":"unknown","full":"malta v.unknown"}));
			expect(
				JSON.stringify(trans2),
			).toBe(JSON.stringify({"a":"a","_":{"b":"b","_":{"c":"c","_":{"d":"d"}}},"full":"abcd"}));
		} catch (err) {
			throw err;
		}
		try {
			m.utils.solveJson({
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
			expect(e instanceof Error).toBe(true);
		}
	});

	it('validateJson', () => {
		const f1 = utils.validateJson('{s:1}'),
			f2 = utils.validateJson('{"s":1}');
		expect(f1).toBe(false);
		expect(f2).toBe(true);
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
			expect(utils.isArray(bench.in)).toBe(bench.out);
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
			expect(utils.isString(bench.in)).toBe(bench.out);
		});
	});

	it('getIterator', () => {
		const it = utils.getIterator([1,2,3]);
		expect(it.size()).toBe(3);
		expect(it.hasNext()).toBe(true);
		expect(it.next()).toBe(1);
		expect(it.hasNext()).toBe(true);
		expect(it.next()).toBe(2);
		expect(it.hasNext()).toBe(true);
		expect(it.next()).toBe(3);
		expect(it.hasNext()).toBe(false);
		expect(it.size()).toBe(3);
		it.reset();
		expect(it.hasNext()).toBe(true);
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
				expect(
					JSON.stringify(utils.jsonFromStr(bench.in)),
				).toBe(JSON.stringify(bench.out));
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
				expect(utils.replaceAll(...bench.in)).toBe(bench.out);
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
				expect(
					JSON.stringify(utils.checkns.apply(null, bench.in)),
				).toBe(JSON.stringify(bench.out));
			})
		);
	});

	it('replaceLinenumbers', () => {
		const tpl = `number one
__LINE__ number two
__LINE__
number four`,
			res = utils.replaceLinenumbers(tpl).split("\n");
		expect(res.length).toBe(4);
		expect(/^2/.test(res[1])).toBe(true);
		expect(/^3/.test(res[2])).toBe(true);
	});

});
