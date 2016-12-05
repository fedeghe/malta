#!/usr/bin/env node

var Malta = require('./malta'),
	watcher = require('./observe'),
	fs = require("fs"),
	path = require("path"),
	child_process = require('child_process');

function doCommand(c, opt) {
	var spawn = child_process.spawn,
		command = spawn(c, opt.split(' ') );

	command.stdout.on( 'data', function (data) {
	    console.log(`${data}`);
	});
	// command.stderr.on( 'data', function (data) {console.log( `stderr: ${data}` );});
	// command.on( 'close', function (code) {console.log( `child process exited with code ${code}` );});
}


function multi(key, el) {
	var opts = [],
		multi = key.match(/(.*)\/\*\.(.*)$/),
		folder, ext,
		multiElements = {},
		isCommand = Malta.isCommand(key);

	if (isCommand) {

		doCommand(isCommand[1], el);
		console.log("COMMAND `" + (isCommand[1] + el).blue() + " EXECUTED");

	} else if (multi) {

		folder = multi[1];

		ext = multi[2];

		fs.readdir(folder, function (err, files) {
			files.forEach(function (file) {
				if (!file.match(/\.buildNum\.json$/) && file.match(new RegExp(".*\." + ext + "$"))){
					// store the process
					multiElements[file] = proceed(folder + '/' + file, el, opts);
				}
			});
		});

		// observe folder, add/remove 
		// 
		watcher.observe(folder, function (diff) {
			
			diff.added.filter(function (v) {
				return v.match(new RegExp(".*\\." + ext + '$'))
			}).forEach(function (v){
				multiElements[v] = proceed(folder + '/' + v, el, opts);
				console.log('ADDED '.yellow() + folder + '/' + v + NL)
			});

			diff.removed.filter(function (v) {
				return v.match(new RegExp(".*\\." + ext + '$'))
			}).forEach(function (v){
				multiElements[v].kill();
				console.log('REMOVED '.yellow() + folder + '/' + v + NL)
			});
		})
		
	} else {
		proceed(key, el, opts);
	}

	function proceed(tpl, options, op){
		var ls = child_process.spawn('malta', [tpl].concat(options.split(/\s/)).concat(op));
		ls.stdout.on('data', function(data) {console.log(data + "");});
		ls.stderr.on('error', function (data) {console.log('Stderr: '.red() + data);});	
		return ls;
	}
}

module.exports = {
	multi : multi
};