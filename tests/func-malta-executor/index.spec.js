const Executor = require('../../src/executor'),
    utils = require('../../src/utils.js');

describe('executor error paths', function () {
    let maltaInstance,
        pmInstance;

    beforeEach(() => {
        maltaInstance = {
            outName: 'test.js',
            data: { content: 'test', name: 'test.js' },
            log_debug: jest.fn(),
            doBuild: false,
            userWatch: null,
            endCb: null
        };
        pmInstance = {
            plugins: {},
            maybeNotifyBuild: jest.fn()
        };
    });

	it('should handle plugin rejection', function (done) {
		const plugin = {
			name: 'failPlugin',
			func: function () {
				return (resolve, reject) => {
					reject('plugin error');
				};
			},
			params: {}
		};
		pmInstance.plugins['js'] = [plugin];
		const iterator = utils.getIterator(['js']);
		const executor = new Executor(iterator, maltaInstance, pmInstance);
		executor.run();
		setTimeout(() => {
			expect(pmInstance.maybeNotifyBuild).toHaveBeenCalledWith({ gotErrs: 'plugin error' });
			expect(maltaInstance.log_debug).toHaveBeenCalledWith("Plugin 'failPlugin' error: ");
			expect(maltaInstance.log_debug).toHaveBeenCalledWith('plugin error');
			done();
		}, 10);
	});

	it('should handle plugin that returns no function', function (done) {
		const plugin = {
			name: 'noopPlugin',
			func: function () {
				return undefined;
			},
			params: {}
		};
		pmInstance.plugins['js'] = [plugin];
		const iterator = utils.getIterator(['js']);
		const executor = new Executor(iterator, maltaInstance, pmInstance);
		executor.run();
		setTimeout(() => {
			expect(pmInstance.maybeNotifyBuild).toHaveBeenCalled();
			done();
		}, 10);
	});
});
