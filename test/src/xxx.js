try {
	var t = require.resolve('epub-gen');
} catch (e) {
	console.log(e)
}
console.log(t)