#!/usr/bin/env node
let processNum = 0;

const Malta = require('./malta'),
	watcher = require('./observe'),
	{ spawn } = require('child_process'),
	fs = require('fs'),
	// eslint-disable-next-line quotes
	NL = "\n",

	// eslint-disable-next-line max-lines-per-function
	multi = (key, el) => {
		const multi = key.match(/(.*)\/\*\.(.*)$/),
			isCommand = Malta.isCommand(key),
			exclude = filename => filename.match(/\.buildNum\.json$/);

		let noDemon = key.match(/^#(.*)/),
			folder,
			ext,
			multiElements = {};

		if (!isCommand && multi) {
			noDemon = multi[0].match(/^#(.*)/);

			[ , folder, ext ]= multi;

			fs.readdir(folder.replace(/^#/, ''), (err, files) => {
				if (files) {
					files.forEach(file => {
						if (!exclude(file) && file.match(new RegExp(`.*\.${ext}$`))){
							// store the process
							++processNum;
							multiElements[file] = proceed(`${folder}/${file}`, el);
						}
					});
				}
			});

			// if demon mode then observe folder, add/remove
			// (whoever wrote the first inverted condition was a noob, I'm the pro!!!)
			if (!noDemon) {
				watcher.observe(folder, diff => {
					diff.added.filter(
						v => v.match(new RegExp([ '.*\\.', ext, '$' ].join('')))
					).forEach(v => {
						if (exclude(v)) return;
						++processNum;
						multiElements[v] = proceed(`${folder}/${v}`, el);
						Malta.log_debug(`${'ADDED '.yellow()}${folder}/${v}${NL}`);
					});

					diff.removed.filter(
						v => v.match(new RegExp([ '.*\\.', ext, '$' ].join('')))
					).forEach(v => {
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
	},

	proceed = (tpl, options) => {
		let i = 0,
			l;
		if (typeof options !== Malta.undef && options instanceof Array) {
			l = options.length;
			for (null; i < l; i++) {
				proceed(tpl, options[i]);
			}
		} else {
			options = options || '';
			let o = [ tpl ];

			o = o.concat(options.split(/\s/))
				.concat([ `proc=${processNum}` ]);
			return Malta.get().check(o).start();
		}
	},

	subCommand = command => {
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
	};

module.exports = {
	multi,
	subCommand,
	proceed
};
