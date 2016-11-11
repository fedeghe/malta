var path = require('path'),
	fs = require('fs');

function malta_reset(o, options) {
	var self = this,
		start = new Date(),
		msg;
	return function (solve, reject){
		console.log('NAME: ' + o.name);
		var dir = path.dirname(o.name);
		o.content = 'function (){alert("Reset!");}';
		o.name = dir + '/' + 'reset.js';
		msg = dir + ' DONE!!!!'		
		solve(o);
		self.notifyAndUnlock(start, msg);
	};
}
// malta_del.ext = ['*'];
module.exports = malta_reset;