#!/usr/bin/env node
const Malta = require('./malta'),
	watcher = require('./observe'),
	spawn = require('child_process').spawn,
	fs = require("fs"),
	//path = require("path"),
	// child_process = require('child_process'),
	//DS = path.sep,
	NL = "\n";

	//TAB = "\t";
let proc = 0;

function multi(key, el) {
	"use strict";
	const multi = key.match(/(.*)\/\*\.(.*)$/),
		isCommand = Malta.isCommand(key),
		exclude = function (filename) {
			return filename.match(/\.buildNum\.json$/);
		};

	let noDemon = key.match(/#(.*)/),
		folder,
		ext,
		multiElements = {};
		//, i, l;

	if (!isCommand && multi) {
		
		noDemon = multi[0].match(/#(.*)/);

		folder = multi[1];

		ext = multi[2];

		fs.readdir(folder.replace(/^#/, ''), function (err, files) {
			if (files) {
				files.forEach(function (file) {
					if (!exclude(file) && file.match(new RegExp(".*\." + ext + "$"))){
						// store the process
						++proc;
						multiElements[file] = proceed(folder + '/' + file, el);
					}
				});
			}
		});

		// if demon mode then observe folder, add/remove 
		//		
		if (!noDemon) {
			watcher.observe(folder, function (diff) {
				diff.added.filter(function (v) {
					return v.match(new RegExp(".*\\." + ext + '$'));
				}).forEach(function (v){
					if (exclude(v)) return;
					++proc;
					multiElements[v] = proceed(folder + '/' + v, el);
					Malta.log_debug('ADDED '.yellow() + folder + '/' + v + NL);
				});

				diff.removed.filter(function (v) {
					return v.match(new RegExp(".*\\." + ext + '$'));
				}).forEach(function (v){
					const outFile = multiElements[v].content_and_name.name;

					// remove out file if exists
					//
					if (fs.existsSync(outFile)) fs.unlink(outFile, () => {});

					multiElements[v].shut();
					multiElements[v] = null;
					Malta.log_debug('REMOVED '.yellow() + folder + '/' + v + NL);
				});
			});
		}
	} else {
		++proc;
		proceed(key, el);
	}

	function proceed(tpl, options){
		let i = 0,
			l;
		if (typeof options !== 'undefined' &&  options instanceof Array) {
			l = options.length;
			for (null; i < l; i++) {
				proceed(tpl, options[i]);
			}
		} else {
			options = options || "";
			let o = [tpl],
				ls;
			// if (typeof options !== 'undefined' && options !== true) {
				o = o.concat(options.split(/\s/));
			// }
			o = o.concat(["proc="+proc]);
			ls = Malta.get().check(o).start();
			return ls;
		}
	}

}

function subCommand(command) {
	"use strict";
	switch (command) {
		case '-clean':
			Malta.log_debug('Removing all .buildNum.json files');
			spawn('find', ['.', '-name', '*.buildNum.json', '-type', 'f', '-delete']);
			Malta.log_debug('... done');
			break;
		default:
			Malta.log_debug(`Command "${command}" not available`);
		break;
	}
	Malta.stop();
} 

module.exports = {
	multi : multi,
	subCommand : subCommand
};