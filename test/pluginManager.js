const assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	os = require('os'),
	malta = require('src/index.js');

const home = os.homedir();

describe('PluginManager', () => {
	let m, mpm;

	it('constructor should give right paths', () => {
		m = malta.get().check([
			'test/fs/pluginmanager/one.js',
			'test/fs/pluginmanager/out',
			'-plugins=test1[string:\"hello\"]',
			'-options=verbose:2'
		]);
		mpm = m.pluginManager;
		assert.equal(mpm.user_path, `${home}/node/malta/plugins`);
		assert.equal(mpm.malta_path, `${home}/node/malta/plugins`);
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
		var m = mpm.require('http');
		assert.equal(typeof m.request, 'function');
	});
	
	it('should run as expected', () => {
		m.then( () => {
			setTimeout(() => {
				m.stop();
				assert.equal(m.hasPlugins, true);
			}, 3000);
		}).start();
	});
	
});
