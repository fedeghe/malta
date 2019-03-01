#!/usr/bin/env node
const Malta = require('./malta'),
	watcher = require('./observe'),
	{ spawn } = require('child_process'),
	fs = require("fs"),
	NL = "\n";

let processNum = 0;

// eslint-disable-next-line max-lines-per-function
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

	if (!isCommand && multi) {
		noDemon = multi[0].match(/#(.*)/);

		[ , folder, ext ]= multi;

		fs.readdir(folder.replace(/^#/, ''), function (err, files) {
			if (files) {
				files.forEach(function (file) {
					if (!exclude(file) && file.match(new RegExp(`.*\.${ext}$`))){
						// store the process
						++processNum;
						multiElements[file] = proceed(`${folder}/${file}`, el);
					}
				});
			}
		});

		// if demon mode then observe folder, add/remove
		//
		if (!noDemon) {
			watcher.observe(folder, function (diff) {
				diff.added.filter(function (v) {
					// eslint-disable-next-line prefer-template
					return v.match(new RegExp(".*\\." + ext + '$'));
				}).forEach(function (v){
					if (exclude(v)) return;
					++processNum;
					multiElements[v] = proceed(`${folder}/${v}`, el);
					Malta.log_debug(`${'ADDED '.yellow()}${folder}/${v}${NL}`);
				});

				diff.removed.filter(function (v) {
					// eslint-disable-next-line prefer-template
					return v.match(new RegExp(".*\\." + ext + '$'));
				}).forEach(function (v){
					const outFile = multiElements[v].data.name;
					// remove out file if exists
					if (fs.existsSync(outFile)) fs.unlink(outFile, () => {});
					multiElements[v].shut();
					multiElements[v] = null;
					Malta.log_debug(`${'REMOVED '.yellow()}${folder}/${v}${NL}`);
				});
			});
		}
	} else {
		++processNum;
		proceed(key, el);
	}
}

function proceed(tpl, options) {
	let i = 0,
		l;
	if (typeof options !== 'undefined' && options instanceof Array) {
		l = options.length;
		for (null; i < l; i++) {
			proceed(tpl, options[i]);
		}
	} else {
		options = options || "";
		let o = [ tpl ];

		o = o.concat(options.split(/\s/))
			.concat([ `proc=${processNum}` ]);
		return Malta.get().check(o).start();
	}
}

function subCommand(command) {
	"use strict";
	switch (command) {
		case '-clean':
			Malta.log_debug('Removing all .buildNum.json files');
			spawn('find', [ '.', '-name', '*.buildNum.json', '-type', 'f', '-delete' ]);
			Malta.log_debug('... done');
			return true;
		default:
			Malta.log_debug(`Command "${command}" not available`);
			return false;
	}
}

module.exports = {
	multi,
	subCommand,
	proceed
};
