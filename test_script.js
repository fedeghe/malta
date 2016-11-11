var Malta = require('malta');
Malta.get().check([
	'test/src/aaa.js',
	'test/out',
	'-require=malta-js-packer[js_base62:false,js_shrink:true]',
	'-options=showPath:false,watchInterval:500,verbose:0'
]).start(function (o) {
/*
	var s = this;
	console.log('name : ' + o.name)
	console.log("content : \n" + o.content);
	'plugin' in o && console.log("plugin : " + o.plugin);
	console.log('=========');
*/
});