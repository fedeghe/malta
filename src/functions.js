#!/usr/bin/env node

var Malta = require('./malta'),
	watcher = require('./observe'),
	fs = require("fs"),
	path = require("path"),
	child_process = require('child_process'),
	DS = path.sep,
	NL = "\n",
	TAB = "\t";
	proc = 0;

function multi(key, el) {
	
	var multi = key.match(/(.*)\/\*\.(.*)$/),
		folder, ext,
		multiElements = {},
		isCommand = Malta.isCommand(key),
		exclude = function (filename) {
			return filename.match(/\.buildNum\.json$/);
		},
		execute = function (c, opt) {
			var spawn = child_process.spawn,
				command = spawn(c, opt.split(' ') );

			command.stdout.on( 'data', function (data) {
			    console.log(`${data}`);
			});
			// command.stderr.on( 'data', function (data) {console.log( `stderr: ${data}` );});
			// command.on( 'close', function (code) {console.log( `child process exited with code ${code}` );});
		};

	if (isCommand) {

		execute(isCommand[1], el);
		console.log("COMMAND `" + (isCommand[1] + el).blue() + " EXECUTED");

	} else if (multi) {

		folder = multi[1];

		ext = multi[2];

		fs.readdir(folder, function (err, files) {
			files && files.forEach(function (file) {
				if (!exclude(file) && file.match(new RegExp(".*\." + ext + "$"))){
					// store the process
					++proc;
					multiElements[file] = proceed(folder + '/' + file, el);
				}
			});
		});

		// if demon mode then observe folder, add/remove 
		// 
		Malta.demon && watcher.observe(folder, function (diff) {
			
			diff.added.filter(function (v) {
				return v.match(new RegExp(".*\\." + ext + '$'))
			}).forEach(function (v){
				if (exclude(v)) return;
				++proc;
				multiElements[v] = proceed(folder + '/' + v, el);
				console.log('ADDED '.yellow() + folder + '/' + v + NL)
			});

			diff.removed.filter(function (v) {
				return v.match(new RegExp(".*\\." + ext + '$'))
			}).forEach(function (v){
				var outFile = multiElements[v].content_and_name.name;

				// remove out file if exists
				//
				fs.existsSync(outFile) && fs.unlink(outFile);

				multiElements[v].shut();
				multiElements[v] = null;
				console.log('REMOVED '.yellow() + folder + '/' + v + NL)
			});
		})
		
	} else {
		++proc;
		proceed(key, el);
	}

	function proceed(tpl, options){
		var o = [tpl].concat(options.split(/\s/)).concat(["proc="+proc]),
			ls = Malta.get().check(o).start();
		return ls;
	}

}

module.exports = {
	multi : multi
};