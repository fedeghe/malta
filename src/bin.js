#!/usr/bin/env node
var Malta = require("./malta"),
	fs = require("fs"),
	path = require("path"),
	functions = require("./functions"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	len = args.length;

// console.log('bin here')

module.exports = Malta;

if (len == 0) {



	Malta.log_help();



} else if (len == 1){

	Malta.outVersion();
	var p = path.resolve(execPath, args[0]),
		runs = fs.existsSync(p) ? require(p) :  false,
		tpl,
		tmp,
		nest;

	// check
	// 
	!runs && Malta.badargs(p);

	for (tpl in runs) {

		//check if is inclusion {whatever.json : true}
		// 
		if (tpl.match(/\.json$/) && runs[tpl] === true) {

			p = path.resolve(execPath, tpl),
			nest = fs.existsSync(p) ? require(p) :  false;
			for (tmp in nest) {
				if (tmp.match(/^\!/)) continue;
				functions.multi(tmp, nest[tmp]);
			}
			
		} else {
			//skip if key begins with !
			if (tpl.match(/^\!/)) continue;
			functions.multi(tpl, runs[tpl]);
		}
	}

} else {

	Malta.outVersion();
	Malta.get().check(args).start();

}
