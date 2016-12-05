#!/usr/bin/env node
var Malta = require("./malta"),
	functions = require("./functions"),
	fs = require("fs"),
	path = require("path"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	len = args.length;

// console.log('script here')

module.exports = Malta;

if (len == 0) {
/*
// ONLY IN THE BIN, must write it, by now it means silence when
// malta is la=unched from the console passing no parameters
	case 0 : 
		Malta.log_help();
		break;
*/
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
