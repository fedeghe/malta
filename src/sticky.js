var os = require('os'),
	child_process = require('child_process'),
	platform = os.platform(),
	// Basso,Blow,Bottle,Frog,Funk,Glass,Hero,Morse,Ping,Pop,Purr,Sosumi,Submarine,Tink
	sound = "Tink",
	tools = {
		mac : ["osascript", "-e 'display notification \"✅ {message}\" with title \"{title}\" sound name \"" + sound + "\"'"],
		linux : ["notify-send", "-t 1000 \"{title}\" \"{message}\""]
	},
	currentOs = (function () {
		if (/^win32/.test(platform)) return "win";
		if (/^linux/.test(platform)) return "linux";
		if (/^darwin/.test(platform)) return "mac";
		return false;
	})();

module.exports = function (title, message) {
	'use strict';
	if (!(currentOs in tools)) return;
	var exeData = tools[currentOs],
		exec = exeData[0],
		params = exeData[1].replace(/\{title\}/, title).replace(/\{message\}/, message);

	child_process.exec("which " + exec, function (error, stdout, stderr) {
		if (error == null) {
			child_process.exec(exec + ' ' + params, function (error, stdout, stderr) { error && console.log(error); });
		}
	});
};