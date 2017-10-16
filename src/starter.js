#!/usr/bin/env node
var Malta = require("./malta"),
	fs = require("fs"),
	path = require("path"),
	functions = require("./functions"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	len = args.length;

module.exports = Malta;


if (len == 0) {

	BIN_MODE && Malta.log_help();

} else if (len == 1){

	Malta.outVersion();
	var p = path.resolve(execPath, args[0]),
		runs = Malta.getRunsFromPath(p),
		tpl,
		tmp,
		nest;

	!runs && Malta.badargs(p);

	if ('EXE' in runs) {
		(function (commands) {
			Malta.log_info('Executing command in EXE section')
			var c,
				i = 0
				clen = commands.length;
			clen ? (function start() {
				if (i < clen - 1) {
					Malta.execute(commands[i].split(/\s/), function (){++i; start();});
				} else {
					Malta.execute(commands[i].split(/\s/), function (){delete runs.EXE; go(runs);});
				}
			})(i) : go(runs);
		})(runs.EXE);
	} else {
		go(runs);
	}

	function go(_runs){

		for (tpl in _runs) {

			//check if is inclusion {whatever.json : true}
			// 
			if (tpl.match(/\.json$/) && _runs[tpl] === true) {

				p = path.resolve(execPath, tpl),
				nest = fs.existsSync(p) ? require(p) :  false;
				for (tmp in nest) {
					if (tmp.match(/^\!/)) continue;
					functions.multi(tmp, nest[tmp]);
				}
				
			} else {
				//skip if key begins with !
				if (tpl.match(/^\!/)) continue;
				functions.multi(tpl, _runs[tpl]);
			}
		}
	}

} else {

	Malta.outVersion();
	Malta.get().check(args).start();

}