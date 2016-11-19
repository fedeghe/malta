var fs = require('fs'),
	path = require('path');

module.exports = (function () {
	var elements = {};
	function observe(folder) {
		var actual = {},
			previous = false;
		if (folder in elements) return false;
		elements[folder] = setInterval(function () {
			fs.readdir(folder, function (err, files) {
				if (!previous) {
					previous = {files : files};
				}
				actual.files = files;
				if (previous.files.length !== actual.files.length) {
					console.log(actual);
				}
				previous.files = actual.files;
			})
		}, 100);
		return true;
	}

	return {
		watch : observe,
		unwatch : function (folder) {
			if (folder in elements) {
				clearInterval(elements[folder]);
				delete elements[folder];
				return true;
			}
			return false; 
		}
	}
})();
