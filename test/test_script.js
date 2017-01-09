var Malta = require('malta');

// console.log("Malta : ", Malta);


Malta.get().check([
	'src/homepage.less',
	'out',
	//'-require=malta-less...malta-css-uglify...malta-header-comment[name:\"mitlicense.txt\"]',
	'-require=malta-less',
	'-options=showPath:false,watchInterval:500,verbose:0'
]).start(function (o, who) {
	
	// console.log("=========\n\nWRITING\n\n");

	// var s = this;

	console.log('who : ' + who.name)
	console.log('who : ' + this.name)
	console.log('name : ' + o.name)
	// console.log("content : \n" + o.content);
	// 'plugin' in o && console.log("plugin : " + o.plugin);
	// console.log('=========');
	
	// console.log('context : ', this);
	// console.log('arguments : ', arguments);
});