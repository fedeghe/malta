const fs = require('fs'),
	path = require('path'),
	functions = require('../../src/functions'),
	Malta = require('../../src/malta'),
	watcher = require('../../src/observe'),
    folder = path.dirname(__filename);

describe('check subCommands', function () {
	it('-clean works', function (done) {
		// first create a *.buildNum.json
		fs.writeFile(`${folder}/aaa.buildNum.json`, '', function () {
			if (fs.existsSync(`${folder}/aaa.buildNum.json`)) {
				functions.subCommand('-clean') && done();
			}
		});
	});
	it('-clean is the only command', function (done) {
		!functions.subCommand('-unclean') && done();
	});
});

describe('proceed', function () {
	let mockInstance;

	beforeEach(() => {
		mockInstance = {
			check: jest.fn(() => mockInstance),
			start: jest.fn(() => mockInstance)
		};
		jest.spyOn(Malta, 'get').mockReturnValue(mockInstance);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should start a single build with options', function () {
		functions.proceed('tpl.js', '-vars=foo.json');
		expect(mockInstance.check).toHaveBeenCalledTimes(1);
		const args = mockInstance.check.mock.calls[0][0];
		expect(args).toContain('tpl.js');
		expect(args).toContain('-vars=foo.json');
		expect(args.some(a => a.match(/^proc=/))).toBe(true);
	});

	it('should start multiple builds for array options', function () {
		functions.proceed('tpl.js', ['opt1', 'opt2']);
		expect(mockInstance.check).toHaveBeenCalledTimes(2);
	});

	it('should handle empty options', function () {
		functions.proceed('tpl.js');
		expect(mockInstance.check).toHaveBeenCalledTimes(1);
		const args = mockInstance.check.mock.calls[0][0];
		expect(args).toContain('tpl.js');
	});
});

describe('multi', function () {
	let mockInstance;

	beforeEach(() => {
		mockInstance = {
			check: jest.fn(() => mockInstance),
			start: jest.fn(() => mockInstance),
			shut: jest.fn(),
			data: { name: 'out/c.js' }
		};
		jest.spyOn(Malta, 'get').mockReturnValue(mockInstance);
		jest.spyOn(fs, 'readdir').mockImplementation((dir, cb) => cb(null, ['a.js', 'b.js']));
		jest.spyOn(watcher, 'observe').mockImplementation(() => {});
		jest.spyOn(fs, 'existsSync').mockReturnValue(false);
		jest.spyOn(fs, 'unlink').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should handle wildcard and start builds for matching files', function (done) {
		functions.multi('folder/*.js', 'out');
		setTimeout(() => {
			expect(fs.readdir).toHaveBeenCalledWith('folder', expect.any(Function));
			expect(mockInstance.check).toHaveBeenCalledTimes(2);
			done();
		}, 10);
	});

	it('should not observe in noDemon mode (#prefix)', function (done) {
		functions.multi('#folder/*.js', 'out');
		setTimeout(() => {
			expect(fs.readdir).toHaveBeenCalledWith('folder', expect.any(Function));
			expect(watcher.observe).not.toHaveBeenCalled();
			done();
		}, 10);
	});

	it('should observe in demon mode', function (done) {
		functions.multi('folder/*.js', 'out');
		setTimeout(() => {
			expect(watcher.observe).toHaveBeenCalledWith('folder', expect.any(Function), 'js');
			done();
		}, 10);
	});

	it('should handle non-wildcard keys directly', function () {
		functions.multi('single.js', 'out');
		expect(mockInstance.check).toHaveBeenCalledTimes(1);
	});

	it('should handle commands without wildcard', function () {
		functions.multi('EXE', 'out');
		expect(mockInstance.check).toHaveBeenCalledTimes(1);
	});

	it('should exclude buildNum.json files from wildcard', function (done) {
		jest.spyOn(fs, 'readdir').mockImplementation((dir, cb) => cb(null, ['a.js', 'a.buildNum.json']));
		functions.multi('folder/*.js', 'out');
		setTimeout(() => {
			expect(mockInstance.check).toHaveBeenCalledTimes(1);
			done();
		}, 10);
	});

	it('should handle observe added files', function (done) {
		functions.multi('folder/*.js', 'out');
		setTimeout(() => {
			const observeCb = watcher.observe.mock.calls[0][1];
			observeCb({ added: ['c.js'], removed: [] }, 'js');
			expect(mockInstance.check).toHaveBeenCalledTimes(3); // 2 initial + 1 added
			done();
		}, 10);
	});

	it('should handle observe removed files', function (done) {
		functions.multi('folder/*.js', 'out');
		setTimeout(() => {
			const observeCb = watcher.observe.mock.calls[0][1];
			// simulate added then removed
			observeCb({ added: ['c.js'], removed: [] }, 'js');
			observeCb({ added: [], removed: ['c.js'] }, 'js');
			expect(mockInstance.shut).toHaveBeenCalled();
			done();
		}, 10);
	});
});
