#!/usr/bin/env node
const Malta = require("./malta"),
	// fs = require("fs"),
	path = require("path"),
	functions = require("./functions"),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	len = args.length;

module.exports = Malta;

M(args, len);

function print(msg, i, tot) {
	"use strict";
	const perc = (typeof i !== 'undefined' && typeof tot !== 'undefined') ?
		(parseInt(100*i/tot, 10) + '% ').white()
		:
		"";
	console.log(perc + msg);
}


function M(_args, _len) {
	"use strict";

	function go(_runs) {
		for (let tpl in _runs) {
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

	// no params -> print help and exit
	if (_len === 0) {

		if (global.BIN_MODE) Malta.log_help();

	// just one param is given -> is a build json file
	//
	} else if (_len === 1){

		Malta.outVersion();

		_args[0].match(/^-/) && functions.subCommand(_args[0]);

		const p = path.resolve(execPath, _args[0]),
			runs = Malta.getRunsFromPath(p);

		// let	tpl;
			// tmp,
			// nest;

		if (!runs) Malta.badargs(p);

		if ('EXE' in runs) {
			(function (commands) {
				Malta.log_info("\n" + "EXE".red() + " section for " + _args[0]);
				
				// let c,
				let	i = 0;
				
				const clen = commands.length;

				if (clen) {
					(function start() {
						if (i < clen-1) {
							print("execution: " + commands[i+1], i+1, clen-1);
							Malta.execute(commands[i].split(/\s/), function (){++i; start();});
						} else {
							Malta.execute(commands[i].split(/\s/), function (){delete runs.EXE; go(runs);});
						}
						if (i === clen - 1) {
							print("...done!\n");
						}
					})(i);
				} else {
					 go(runs);
				}
			})(runs.EXE);
		} else {
			go(runs);
		}



	// single build
	} else {
		Malta.outVersion();
		Malta.get().check(_args).start();
	}
}