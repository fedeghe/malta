#!/usr/bin/env node
var Malta = require("./malta.js"),
	fs = require("fs"),
	path = require("path"),
	functions = require("./functions.js"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	j = 0,
	len = args.length;

// console.log('bin here')

module.exports = Malta;

if (len == 0) {

	Malta.log_help();

} else if (len == 1){

	Malta.outVersion();
	var p = path.resolve(execPath, args[0]),
		runs = fs.existsSync(p) ? require(p) :  false,
		tpl;

	// check
	// 
	!runs && Malta.badargs(p);
	for (tpl in runs) {
		//skip if key begins with !
		if (tpl.match(/^\!/)) continue;
		functions.multi(tpl, runs[tpl]);
	}

} else {

	Malta.outVersion();
	Malta.get().check(args).start();

}
