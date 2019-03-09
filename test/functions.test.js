const assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	functions = require('src/functions');

describe('check subCommands', () => {
	var trgFolder = path.resolve(path.dirname(__filename) + '/fs');
	it('-clean works', function (done) {
		// first create a *.buildNum.json
		fs.writeFile(trgFolder + '/aaa.buildNum.json', '', () => {
			if (fs.existsSync(trgFolder + '/aaa.buildNum.json')) {
				var res = functions.subCommand('-clean');
				assert.equal(res, true);
			}
			done();
		});
	});
	it('-clean is the only command', done => {
		!functions.subCommand('-unclean') && done();
	});
});

describe('proceed', () => {
	it('should create more destinations from a single file', (done) => {
		const dests = [
				'test/fs/functions/proceed/dest1',
				'test/fs/functions/proceed/dest2',
				'test/fs/functions/proceed/dest3'
			],
			maltas = functions.proceed('#test/fs/functions/proceed/tpl.js', dests);
		let num = dests.length;
			
		maltas.forEach(m => m.then(function() { // need this here, leave the es5
			fs.unlink(this.outName, () => {
				num--;
				if (num === 0) done();
			});
		}));
	})
});

describe('multi', () => {
	it('should use wildcard as source tpl', (done) => {
		const dest = 'test/fs/functions/multi/dest',
			maltas = functions.multi('#test/fs/functions/multi/*.js', dest);

		let num = Object.keys(maltas).length;

		for (var m in maltas) {
			maltas[m].then(function () { // need this here, leave the es5
				console.log(this.outName)
				fs.unlink(this.outName, () => {
					num--;
					if (num === 0) {
						// maltas[m].stop();
						done();
					}
				});
			});
		}
	});
	//.timeout(3000);
});

// describe('multi demon create', () => {
// 	it('should use wildcard as source tpl', (done) => {
// 		const dest = 'test/fs/functions/multi/dest',
// 			maltas = functions.multi('test/fs/functions/multi/*.js', dest),
// 			keys = Object.keys(maltas);
// 		console.log('prima')
// 		console.log(Object.keys(maltas))
// 		function add() { // need this here, leave the es5
// 			fs.writeFileSync('test/fs/functions/multi/x.js');
// 			setTimeout(() => {
// 				console.log('---------------')
// 				console.log('dopo')
// 				console.log(Object.keys(maltas))
// 				// fs.unlinkSync('test/fs/functions/multi/x.js');
// 				done();
// 			}, 2000);
// 		}
// 	}).timeout(5000);
// });



// describe('multi demon delete', () => {
// 	it('should use wildcard as source tpl', (done) => {
// 		const dest = 'test/fs/functions/multi/dest',
// 			maltas = functions.multi('test/fs/functions/multi/*.js', dest, remove),
// 			keys = Object.keys(maltas);
		
// 		function remove() {
// 			fs.unlinkSync('test/fs/functions/multi/x.js');
// 			setTimeout(() => {
// 				done();
// 			}, 2000);
// 		}

// 	}).timeout(10000);
// });


