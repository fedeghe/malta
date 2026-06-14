const fs = require('fs'),
    path = require('path'),
    childProcess = require('child_process'),
    events = require('events'),
    Malta = require('../../src/malta'),
    utils = require('../../src/utils.js');

describe('Malta static methods', function () {
    let prevVerbose;

    beforeEach(() => {
        prevVerbose = Malta.verbose;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
        jest.restoreAllMocks();
    });

    afterEach(() => {
        Malta.verbose = prevVerbose;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
        jest.restoreAllMocks();
    });

    afterAll(() => {
        Malta.verbose = 1;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
    });

    it('Malta.execute should call cb with error on non-zero exit', function (done) {
        const handlers = {};
        const execSpy = jest.spyOn(childProcess, 'exec').mockImplementation(() => ({
            stdout: { on: jest.fn() },
            on: (evt, fn) => { handlers[evt] = fn; }
        }));
        Malta.execute(['echo', 'test'], (err) => {
            expect(err).toBeInstanceOf(Error);
            execSpy.mockRestore();
            done();
        });
        handlers.close && handlers.close(1);
    });

    it('Malta.execute should call cb with error on exec error', function (done) {
        const handlers = {};
        const execSpy = jest.spyOn(childProcess, 'exec').mockImplementation(() => ({
            stdout: { on: jest.fn() },
            on: (evt, fn) => { handlers[evt] = fn; }
        }));
        Malta.execute(['echo', 'test'], (err) => {
            expect(err).toBeInstanceOf(Error);
            execSpy.mockRestore();
            done();
        });
        handlers.error && handlers.error(new Error('exec fail'));
    });

    it('Malta.badargs should call Malta.stop', function () {
        const stopSpy = jest.spyOn(Malta, 'stop').mockImplementation(() => {});
        Malta.badargs('a', 'b');
        expect(stopSpy).toHaveBeenCalled();
        stopSpy.mockRestore();
    });

    it('Malta.log_help should call outVersion, log_debug and stop', function () {
        const outSpy = jest.spyOn(Malta, 'outVersion').mockImplementation(() => {});
        const debugSpy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        const stopSpy = jest.spyOn(Malta, 'stop').mockImplementation(() => {});
        Malta.log_help();
        expect(outSpy).toHaveBeenCalledWith(true);
        expect(debugSpy).toHaveBeenCalled();
        expect(stopSpy).toHaveBeenCalled();
        outSpy.mockRestore();
        debugSpy.mockRestore();
        stopSpy.mockRestore();
    });

    it('Malta.outVersion should return early when verbose is 0', function () {
        Malta.verbose = 0;
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        Malta.outVersion();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
    });

    it('Malta.outVersion should return early when printfile exists', function () {
        const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        Malta.outVersion();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
        existsSpy.mockRestore();
    });

    it('Malta.stop should invoke a function argument', function () {
        const fn = jest.fn();
        Malta.stop(fn);
        expect(fn).toHaveBeenCalled();
    });

    it('Malta.stop should not run if already not running', function () {
        Malta.running = false;
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        Malta.stop();
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
    });

    it('Malta.stop should log when verbose > 0', function () {
        Malta.running = true;
        Malta.verbose = 1;
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        Malta.stop();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockRestore();
    });

    it('Malta.stop should shut instances', function () {
        Malta.running = true;
        const inst = { shut: jest.fn() };
        Malta.instances = [inst];
        Malta.stop();
        expect(inst.shut).toHaveBeenCalled();
        expect(Malta.instances).toEqual([]);
    });

    it('Malta.getRunsFromPath should handle invalid JSON', function () {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('not json');
        const infoSpy = jest.spyOn(Malta, 'log_info').mockImplementation(() => {});
        const errSpy = jest.spyOn(Malta, 'log_err').mockImplementation(() => {});
        const stopSpy = jest.spyOn(Malta, 'stop').mockImplementation(() => {});
        Malta.getRunsFromPath('fake.json');
        expect(infoSpy).toHaveBeenCalled();
        expect(errSpy).toHaveBeenCalled();
        expect(stopSpy).toHaveBeenCalled();
        infoSpy.mockRestore();
        errSpy.mockRestore();
        stopSpy.mockRestore();
    });

    it('Malta.getRunsFromPath should prefix demon paths with #', function () {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ 'a.js': 'out' }));
        const res = Malta.getRunsFromPath('#fake.json');
        expect(res).toEqual({ '#a.js': 'out' });
    });
});

describe('Malta prototype methods', function () {
    let m,
        prevVerbose;

    beforeEach(() => {
        prevVerbose = Malta.verbose;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
        m = new Malta();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        if (m && typeof m.shut === 'function') {
            try { m.shut(); } catch (e) {}
        }
        Malta.verbose = prevVerbose;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
        jest.restoreAllMocks();
    });

    afterAll(() => {
        Malta.verbose = 1;
        Malta.running = true;
        Malta.instances = [];
        Malta.executeCheck = 0;
    });

    it('doErr should log debug', function () {
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        m.doErr(new Error('x'), { name: 'test' }, 'plug');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('delete_result should log debug', function () {
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        m.delete_result();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('checkInvolved should warn on circular inclusion', function () {
        m.queue = new Array(22).fill('a').concat(new Array(22).fill('b'));
        const infoSpy = jest.spyOn(m, 'log_info').mockImplementation(() => {});
        m.checkInvolved();
        expect(infoSpy).toHaveBeenCalled();
        infoSpy.mockRestore();
    });

    it('checkInvolved should warn on too many files', function () {
        m.involvedFiles = m.MAX_INVOLVED + 1;
        m.queue = new Array(100).fill('x');
        const errSpy = jest.spyOn(m, 'log_err').mockImplementation(() => {});
        m.checkInvolved();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });

    it('microTpl should return original on error', function () {
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        const res = Malta.microTpl('hello <malta%throw new Error("bad")%malta> world');
        expect(res).toBe('hello <malta%throw new Error("bad")%malta> world');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('replace_all should warn and comment on missing file with known ext', function () {
        m.baseDir = '/tmp';
        m.placeholderMode = 'dolla';
        // real dolla files regex has 4 capture groups: (indent) $$filename$$ ({inner})?
        m.reg = { dolla: { files: '(.*)\\$\\$([@A-z0-9-_/.]+)({([^}]*)})?\\$\\$', innerVars: n => new RegExp('\\$' + n + '\\$'), innerVarsBackup: () => /\$\w*(\|([^\$]*))?\$/g } };
        m.comments = { js: s => `/* ${s} */` };
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const infoSpy = jest.spyOn(m, 'log_info').mockImplementation(() => {});
        const res = m.replace_all('include $$file.js$$');
        expect(infoSpy).toHaveBeenCalled();
        expect(res).toContain('/*  ### file.js ###  */');
        infoSpy.mockRestore();
    });

    it('replace_all should warn and return empty on missing file with unknown ext', function () {
        m.baseDir = '/tmp';
        m.placeholderMode = 'dolla';
        m.reg = { dolla: { files: '(.*)\\$\\$([@A-z0-9-_/.]+)({([^}]*)})?\\$\\$', innerVars: n => new RegExp('\\$' + n + '\\$'), innerVarsBackup: () => /\$\w*(\|([^\$]*))?\$/g } };
        m.comments = {};
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const infoSpy = jest.spyOn(m, 'log_info').mockImplementation(() => {});
        const res = m.replace_all('include $$file.xyz$$');
        expect(infoSpy).toHaveBeenCalled();
        expect(res).toBe('');
        infoSpy.mockRestore();
    });

    it('replace_all should add path tip when showPath is true', function () {
        m.baseDir = '/tmp';
        m.placeholderMode = 'dolla';
        m.reg = { dolla: { files: '(.*)\\$\\$([@A-z0-9-_/.]+)({([^}]*)})?\\$\\$', innerVars: n => new RegExp('\\$' + n + '\\$'), innerVarsBackup: () => /\$\w*(\|([^\$]*))?\$/g } };
        m.comments = { js: s => `/* ${s} */` };
        m.showPath = true;
        m.files = { '/tmp/file.js': { content: Buffer.from('content') } };
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        const res = m.replace_all('include $$file.js$$');
        expect(res).toContain(`[${Malta.name}] file.js`);
    });

    it('replace_vars should use func placeholderMode', function () {
        m.placeholderMode = 'func';
        m.reg = { func: { vars: 'maltaV\\(\'([A-z0-9-_/.\[\]]*)\'\\)' } };
        m.vars = { foo: 'bar' };
        jest.spyOn(utils, 'checkns').mockReturnValue(undefined);
        const res = m.replace_vars("hello maltaV('foo') world");
        expect(res).toContain("maltaV('foo')");
    });

    it('replace_vars should use default placeholderMode', function () {
        m.placeholderMode = 'default';
        m.reg = { default: { vars: '\\$(\\w+)\\$' } };
        m.vars = { foo: 'bar' };
        jest.spyOn(utils, 'checkns').mockReturnValue(undefined);
        const res = m.replace_vars('hello $foo$ world');
        expect(res).toBe('hello foo world');
    });

    it('signBuildNumber should handle JSON parse error', function () {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('bad json');
        const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        m.baseDir = '/tmp';
        m.inName = 'test.js';
        m.signBuildNumber();
        expect(writeSpy).toHaveBeenCalledWith('/tmp/.buildNum.json', '{}');
        writeSpy.mockRestore();
    });

    it('setupWatchers should catch fs.watch error', function () {
        m.watchers = {};
        m.files = { '/tmp/fake.txt': {} };
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'watch').mockImplementation(() => { throw new Error('watch err'); });
        const spy = jest.spyOn(m, 'log_debug').mockImplementation(() => {});
        m.setupWatchers();
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Could not watch'));
        spy.mockRestore();
    });

    it('handleFileChange should close watchers when file removed', function () {
        m.doBuild = false;
        m.queue = [];
        m.files = {};
        m.watchers = {};
        const closeSpy = jest.spyOn(m, 'closeWatchers').mockImplementation(() => {});
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        m.handleFileChange('/tmp/removed.js');
        expect(closeSpy).toHaveBeenCalled();
        spy.mockRestore();
        closeSpy.mockRestore();
    });

    it('handleFileChange should reload invalid vars file', function () {
        m.doBuild = false;
        m.queue = [];
        m.files = {};
        m.watchers = {};
        m.varPath = '/tmp/vars.json';
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('bad json');
        jest.spyOn(fs, 'statSync').mockReturnValue({ mtime: { getTime: () => 1 } });
        jest.spyOn(utils, 'validateJson').mockReturnValue(false);
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        m.parse = jest.fn();
        m.build = jest.fn();
        m.handleFileChange('/tmp/vars.json');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('not valid'));
        spy.mockRestore();
    });

    it('loadVars should handle invalid JSON', function () {
        m.args = [];
        m.baseDir = '/tmp';
        m.varPath = '/tmp/vars.json';
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('bad json');
        jest.spyOn(utils, 'validateJson').mockReturnValue(false);
        const spy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        m.loadVars();
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('not valid'));
        spy.mockRestore();
    });

    it('loadVars should catch generic read error', function () {
        m.args = [];
        m.baseDir = '/tmp';
        m.varPath = '/tmp/vars.json';
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('fail'); });
        m.loadVars();
        expect(m.vars).toEqual({});
    });

    it('loadVars should handle solveJson looping error', function () {
        m.args = [];
        m.baseDir = '/tmp';
        m.varPath = '/tmp/vars.json';
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('{"a":"b"}');
        jest.spyOn(utils, 'validateJson').mockReturnValue(true);
        jest.spyOn(utils, 'solveJson').mockImplementation(() => { const e = new Error('loop'); e.stop = true; throw e; });
        const errSpy = jest.spyOn(Malta, 'log_err').mockImplementation(() => {});
        m.loadVars();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });

    it('setupWatchers should trigger change callback', function () {
        m.watchers = {};
        m.files = { '/tmp/fake.txt': {} };
        m.doBuild = false;
        let watcherEmitter;
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'watch').mockImplementation((f, cb) => {
            watcherEmitter = new events.EventEmitter();
            watcherEmitter.on('change', cb);
            return watcherEmitter;
        });
        const handleSpy = jest.spyOn(m, 'handleFileChange').mockImplementation(() => {});
        m.setupWatchers();
        watcherEmitter.emit('change', 'change');
        expect(handleSpy).toHaveBeenCalledWith('/tmp/fake.txt');
        handleSpy.mockRestore();
    });

    it('closeWatchers should catch close error', function () {
        m.watchers = { '/tmp/fake.txt': { close: () => { throw new Error('close err'); } } };
        m.closeWatchers();
        expect(m.watchers).toEqual({});
    });

    it('watch should setup watchers and interval', function () {
        const setupSpy = jest.spyOn(m, 'setupWatchers').mockImplementation(() => {});
        m.watch();
        expect(setupSpy).toHaveBeenCalled();
        expect(m.watch_TI).toBeDefined();
        clearInterval(m.watch_TI);
        setupSpy.mockRestore();
    });

    it('watch interval should refresh watchers when not building', function () {
        jest.useFakeTimers();
        m.doBuild = false;
        const setupSpy = jest.spyOn(m, 'setupWatchers').mockImplementation(() => {});
        m.watch();
        jest.advanceTimersByTime(5001);
        expect(setupSpy).toHaveBeenCalledTimes(2); // initial + interval
        clearInterval(m.watch_TI);
        jest.useRealTimers();
        setupSpy.mockRestore();
    });

    it('shut should clear interval and close watchers', function () {
        m.watch_TI = setInterval(() => {}, 1000);
        const closeSpy = jest.spyOn(m, 'closeWatchers').mockImplementation(() => {});
        m.shut();
        expect(closeSpy).toHaveBeenCalled();
        closeSpy.mockRestore();
    });

    it('listen should not add existing file', function () {
        m.files = { '/tmp/existing.js': { content: 'x' } };
        m.listen('/tmp/existing.js');
        expect(m.files['/tmp/existing.js']).toEqual({ content: 'x' });
    });

    it('start should call watch in demon mode', function () {
        m.demon = true;
        m.tplPath = '/tmp/t.js';
        m.files = {};
        m.varPath = false;
        const watchSpy = jest.spyOn(m, 'watch').mockImplementation(() => {});
        const buildSpy = jest.spyOn(m, 'build').mockImplementation(() => {});
        const parseSpy = jest.spyOn(m, 'parse').mockImplementation(() => {});
        m.start();
        expect(watchSpy).toHaveBeenCalled();
        watchSpy.mockRestore();
        buildSpy.mockRestore();
        parseSpy.mockRestore();
    });

    it('replace_all should process innerVars', function () {
        m.baseDir = '/tmp';
        m.placeholderMode = 'dolla';
        m.reg = { dolla: { files: '(.*)\\$\\$([@A-z0-9-_/.]+)({([^}]*)})?\\$\\$', innerVars: n => new RegExp('\\$' + n + '\\$'), innerVarsBackup: () => /\$\w*(\|([^\$]*))?\$/g } };
        m.comments = { js: s => `/* ${s} */` };
        m.files = { '/tmp/file.js': { content: Buffer.from('hello $name$') } };
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        const res = m.replace_all('include $$file.js{"name":"world"}$$');
        expect(res).toContain('hello world');
    });

    it('handleFileChange should catch solveJson looping error', function () {
        m.doBuild = false;
        m.queue = [];
        m.files = {};
        m.watchers = {};
        m.varPath = '/tmp/vars.json';
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('{"a":"b"}');
        jest.spyOn(fs, 'statSync').mockReturnValue({ mtime: { getTime: () => 1 } });
        jest.spyOn(utils, 'validateJson').mockReturnValue(true);
        jest.spyOn(utils, 'solveJson').mockImplementation(() => { const e = new Error('loop'); e.stop = true; throw e; });
        const errSpy = jest.spyOn(Malta, 'log_err').mockImplementation(() => {});
        m.parse = jest.fn();
        m.build = jest.fn();
        m.handleFileChange('/tmp/vars.json');
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });
});
