const assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	pluginManager = require('src/pluginManager');

describe('PluginManager', () => {
	var pm = new pluginManager();
	it('constructor should give right paths', () => {
		assert.equal(pm.user_path, '/Users/federicoghedina/node/malta/plugins');
		assert.equal(pm.malta_path, '/Users/federicoghedina/node/malta/plugins');
		assert.equal(JSON.stringify(pm.plugins), JSON.stringify({}));
	});
});
