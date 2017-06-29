(function () {
	
	var http = require('http'),
		fs = require('fs')
		getMtime = function(stat_response) {
			return +stat_response.mtime;
		},
		srvStarted = false,
		srvHost = 'http://127.0.0.1',
		srvPort = 1234;

	function Bwatch() {
		this.files = {};
	}
	Bwatch.prototype.start = function () {
		var BW = this;
		http.createServer(function (request, response) {
			response.writeHead(200, {
				'Content-Type': 'application/javascript',
				'Access-Control-Allow-Origin' : '*'
			});

			if (BW.check()) {
				response.end('document.location.reload();');
			} else {
				response.end(';');
			}


		}).listen(srvPort);
	};
	Bwatch.prototype.addFile = function (path) {
		var BW = this;
		if (!(path in this.files)) {
			fs.stat(path, function (err, stats) {
				BW.files[path] = getMtime(stats);
			})
			
		}
	};

	Bwatch.prototype.check = function () {
		var res = false,
			BW = this,
			path,
			tmp;
		for (path in BW.files) {
			tmp = fs.statSync(path);
			if (BW.files[path] < getMtime(tmp)) {
				BW.files[path] = getMtime(tmp);
				console.log('Malta-browser-refresh (modified ' + path.white() + ')')
				return true;
			}
		}
		return res;
	};

	Bwatch.script = `(function () {
		window.setInterval(function () {
			var s = document.createElement('script'),
				srvHost = "${srvHost}",
				srvPort = ${srvPort};
			s.onload = function () {document.body.removeChild(s);};
			s.src = srvHost + ':' + srvPort + "?" + +new Date;
			document.body.appendChild(s);
		}, 1000);
	})()`;


	module.exports = Bwatch;
})();



