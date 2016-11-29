/**
 * Timing function
 *
 * @param      {Function}  f         { parameter_description }
 * @param      {number}    interval  The interval
 */
function doTime(f, interval) {
	var begin = +new Date,
		n = 0,
		diff = 0;
	(function on() {
		var current = +new Date,
			next = begin + n*interval;
		setTimeout(function () {
			current = +new Date;
			next = begin + ++n*interval;
			diff = (current - next) / interval;
			
			f(+new Date ,next, diff);
			on();
			
		}, (1 - diff) * interval)
	})();
}
var i = 0;
doTime(function (t, trg, diff) {
	console.log("("+trg+") "+diff + "%\t\t\t" + (new Array(1 + i++%8).join(" ")) + " " + t);
}, 125);

