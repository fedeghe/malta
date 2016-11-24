var Malta = require('malta');
Malta.get().check([
	'test/src/homepage.less',
	'test/out',
	'-require=malta-less...malta-css-uglify...malta-header-comment[name:\"mitlicense.txt\"]',
	'-options=showPath:false,watchInterval:500,verbose:0'
]).start(function (o, who) {
	console.log("=========\n\nWRITING\n\n");

	var s = this;

	console.log('who : ' + who.name)
	console.log('name : ' + o.name)
	console.log("content : \n" + o.content);
	'plugin' in o && console.log("plugin : " + o.plugin);
	console.log('=========');
});