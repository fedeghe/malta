/**
 * really simple one level promise
 */
function check(inst) {
	var self = inst;
	!self.solved && self.f(
		function () {
			self.solved = 1;
			self.solve && self.solve.apply(null, [].slice.call(arguments, 0));
		},
		function () {
			self.solved = 0;
			self.reject && self.reject.apply(null, [].slice.call(arguments, 0));
		}
	);
};

function MPromise (f) {
	this.f = f;
	this.solved = false;
}
MPromise.prototype.then = function (f) {
	// console.log('DOING THEN'.rainbow())
	this.solve = f;
	check(this);
	return this;
};
MPromise.prototype.catch = function (f) {
	this.reject = f;
	return this;
};
module.exports = MPromise;