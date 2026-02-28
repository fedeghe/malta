const path = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    root = path.resolve(folder, '../..'),
    bin = path.join(root, 'src/bin.js'),
    doneFunc = require('../utils').doneFunc;

const waitForFile = (filePath, timeoutMs = 20000, intervalMs = 100) => new Promise((resolve, reject) => {
    const start = Date.now();
    const probe = () => {
        fs.access(filePath, fs.constants.F_OK, err => {
            if (!err) return resolve();
            if (Date.now() - start >= timeoutMs) return reject(err);
            setTimeout(probe, intervalMs);
        });
    };
    probe();
});

const runAndRead = (buildFile, outFile) => new Promise((resolve, reject) => {
    const ls = child_process.spawn('node', [bin, buildFile], { cwd: root });
    let stderr = '';

    ls.on('error', reject);
    ls.stderr.on('data', chunk => {
        stderr += `${chunk}`;
    });

    ls.on('close', code => {
        if (code !== malta.executeCheck) {
            return reject(new Error(`Unexpected exit code: ${code}\n${stderr}`));
        }

        waitForFile(outFile)
            .then(() => {
                fs.readFile(outFile, 'utf8', (err, cnt) => {
                    if (err) return reject(err);
                    resolve(cnt);
                });
            })
            .catch(reject);
    });
});

describe('plugin manager', function () {
    jest.setTimeout(30000);

    it('should output expected result', async function () {
        const cnt = await runAndRead(`${folder}/one.json`, `${folder}/out/test.flat.json`);
        expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
    });
    it('should output expected result - options to plugin', async function () {
        const cnt = await runAndRead(`${folder}/oneWithOption.json`, `${folder}/out/test.xxx.json`);
        expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
    });
    it('should output expected result - wildCard - options to plugin', async function () {
        const cnt = await runAndRead(`${folder}/wildCardWithOption.json`, `${folder}/out/test.yyy.json`);
        expect(cnt).toBe('{"person":{"name":"Federico","surname":"Ghedina"}}');
    });
    it('should remove the folders/files just created', doneFunc(folder));
});
