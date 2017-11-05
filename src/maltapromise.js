/**
 * really simple one level promise
 */
function check(inst) {
	"use strict";
	const self = inst;
	if (!self.solved) {
		self.f(
			function () {
				self.solved = 1;
				if (self.solve)
					self.solve.apply(null, [].slice.call(arguments, 0));
			},
			function () {
				self.solved = 0;
				if (self.reject)
					self.reject.apply(null, [].slice.call(arguments, 0));
			}
		);
	}
}

function MPromise (f) {
	"use strict";
	this.f = f;
	this.solved = false;
	this.reject = true;
}

MPromise.prototype.then = function (f) {
	"use strict";
	this.solve = f || true;
	check(this);
	return this;
};

MPromise.prototype.catch = function (f) {
	"use strict";
	this.reject = f;
	return this;
};

module.exports = MPromise;