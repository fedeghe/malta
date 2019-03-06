const assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	malta = require('src/index.js');

describe('PluginManager', () => {
	var m = malta.get().check([
			'test/fs/pluginmanager/one.js',
			'test/fs/pluginmanager/out',
			'-plugins=test1[string:\"hello\"]',
			'-options=verbose:2'
		]);
	let mpm = m.pluginManager;
	it('constructor should give right paths', () => {
		assert.equal(mpm.user_path, '/Users/federicoghedina/node/malta/plugins');
		assert.equal(mpm.malta_path, '/Users/federicoghedina/node/malta/plugins');
		assert.equal(
			JSON.stringify(mpm.plugins),
			JSON.stringify({
				"js": [{
					"name": "testPlugin1",
					"params": { "string": "hello" }
				}]
			})
		);
	});
	
	it('should add the expected plugins', () => {
		mpm.add('test2', {string: 'hello'});
		mpm.add('test3', {string: 'hello'});
		mpm.add('test4', {string: 'hello'});
		// assert.equal(mpm.plugins['*'].length, 1);
		
		assert.equal(mpm.plugins['js'].length, 4);
		assert.equal(mpm.plugins['php'].length, 1);
	});
	
	it('should require as expected', () => {
		var m = mpm.require('malta');
		assert.equal(m.name, 'Malta');
	});
	/*
	it('should run as expected', (done) => {
		m.start();
		// const res = mpm.run(m, malta);
		assert.equal(m.hasPlugins, true);
		// assert.equal(res, true);
		setTimeout(() => {
			
			m.stop();
			done();
		}, 2000); 
	});
	*/
});
