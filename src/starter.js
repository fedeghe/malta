#!/usr/bin/env node
var Malta = require("./malta"),
	fs = require("fs"),
	path = require("path"),
	functions = require("./functions"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	len = args.length;

module.exports = Malta;

M(args, len);

function M(_args, _len) {
	// no params -> print help and exit
	if (_len == 0) {

		BIN_MODE && Malta.log_help();

	// just one param is given -> is a build json file
	//
	} else if (_len == 1){

		Malta.outVersion();
		var p = path.resolve(execPath, _args[0]),
			runs = Malta.getRunsFromPath(p),
			tpl,
			tmp,
			nest;

		!runs && Malta.badargs(p);

		if ('EXE' in runs) {
			(function (commands) {
				Malta.log_info('Executing command in EXE section for ' + _args[0])
				var c,
					i = 0
					clen = commands.length;
				clen ? (function start() {
					if (i < clen - 1) {
						Malta.execute(commands[i].split(/\s/), function (){++i; start();});
					} else {
						Malta.execute(commands[i].split(/\s/), function (){delete runs.EXE; go(runs);});
					}
					if (i == clen - 1){
						console.log('...done!');
					}
				})(i) : go(runs);
			})(runs.EXE);
		} else {
			go(runs);
		}

		function go(_runs){
			var i, tmpArr;
			for (tpl in _runs) {

				//check if is inclusion {whatever.json : true}
				// 
				if (tpl.match(/\.json$/) && _runs[tpl] === true) {
					M([tpl], 1);
				} else {
					//skip if key begins with !
					if (tpl.match(/^\!/)) continue;
					functions.multi(tpl, _runs[tpl]);
				}
			}
		}

	// single build
	} else {
		Malta.outVersion();
		Malta.get().check(_args).start();
	}
}