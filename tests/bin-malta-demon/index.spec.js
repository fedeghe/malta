const assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;


describe('multi watch', function () {
    it('should output correctly all files', function (done) {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/one.json`]);
            
            setTimeout(() => {
                new Promise(add).then(
                    () => new Promise((s) => {
                        setTimeout(s, 200)
                    })
                ).then(del).then(
                    () => new Promise((s) => {
                        setTimeout(s, 200)
                    })
                ).then(kill);
            }, 1000);

            const add = (solve, reject) => fs.writeFile(`${folder}/code/two.js`, 'var t = 1;', (err) => {
                    (err ? reject : solve)();
                }),
                del = () => fs.unlink(`${folder}/code/two.js`, () => {}),
                kill = () => {
                    done();
                    ls.stdin.pause();
                    ls.kill();
                };
        } catch (err) {
            throw err;
        }
    });
    it('should output correctly all files, watching for changes', done => {
        try {
            const ls = child_process.spawn('node', ['src/bin.js', `${folder}/test.js`, 'out', '-options=watchInterval:100,verbose:2']),
                modify = (solve, reject) =>
                    fs.writeFile(`${folder}/test.js`, 'var t = 3;',
                        err => (err ? reject : solve)()
                    ),
                check = () => new Promise((solve, reject) =>
                    fs.readFile(`${folder}/code/test.js`,
                        (err, content) => (`${content}` === 'var t = 3;' ? solve : reject)()
                    )
                ),
                kill = () => {
                    done();
                    ls.stdin.pause();
                    ls.kill();
                };

            setTimeout(() => {
                new Promise(modify).then(
                    () => new Promise((s) => {
                        setTimeout(s, 200)
                    })
                ).then(check).then(
                    () => new Promise((s) => {
                        setTimeout(s, 400)
                    })
                ).then(kill);
            }, 600);
        } catch (err) {
            throw err;
        }
    });
    it('should cleanup correctly all files', doneFunc(folder));
});