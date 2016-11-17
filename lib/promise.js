function MPromise (f) {
	var self = this;
	!self.called && f(function () {
		self.called = true;
		self.cb.apply(null, [].slice.call(arguments, 0));
	});
	
}
MPromise.prototype.then = function (f) {this.cb = f;};
module.exports = MPromise;