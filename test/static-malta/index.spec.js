const assert = require('assert'),
    malta = require('../../src/index.js');

describe('static methods', () => {

    beforeEach(() => {
        oldConsoleLog = console.log;
        console.log = () => {
            console.log.calls.push([].slice.call(arguments))
        }
        console.log.calls = [];
        console.log.reset = () => {
            console.log.calls = [];
        };
    });

    it("should get a malta instance", () => {
        let m = malta.get();
        assert(m instanceof malta);
    });

    it("should check dependencies", done => {
        try{
            malta.checkDeps('malta', 'lodash', 'do not exists');
        } catch(e) {
            // console.log('Comes here then an error is rethrown')
            done();
        }
    });

    it("should check executable", done => {
        malta.checkExec('java', err => !err && done());
    });

    it("should check non existent executable", done => {
        malta.checkExec('javazzzzz', err => err && done());
    });
    
    it("should get runs from path", done => {
        const ret = malta.getRunsFromPath('package.json');
        Object.keys(ret).length && done()
    });

    it("should get runs from path no demon", done => {
        const ret = malta.getRunsFromPath('#test/static-malta/getRunsFromPath.json');
        Object.keys(ret).length && done();
    });

    it("should log_debug", () => {
        malta.verbose = 2;
        const msg = malta.log_debug('my debug');
        assert(console.log.calls.length === 1);
        assert(msg === 'my debug');
    });
    it("should not log_debug", () => {
        malta.verbose = 0;
        const msg = malta.log_debug('my debug');
        assert(console.log.calls.length === 0);
        assert(typeof msg === 'undefined');
    });

    it("should log_err", () => {
        malta.verbose = 2;
        const msg = malta.log_err('my error', 'my error message');
        assert(console.log.calls.length === 3);
        assert(msg.length > 0);
        assert(msg === 'my error message');
    });
    it("should not log_err", () => {
        malta.verbose = 0;
        const msg = malta.log_err('my error');
        assert(console.log.calls.length === 0);
        assert(typeof msg === 'undefined');
    });

    it("should log_dir", () => {
        malta.verbose = 2;
        const msg = malta.log_dir({dir: 'there'});
        assert(console.log.calls.length === 1);
        assert(msg == JSON.stringify({"dir":"there"}));
    });
    it("should not log_dir", () => {
        malta.verbose = 0;
        const msg = malta.log_dir({dir: 'there'});
        assert(console.log.calls.length === 0);
        assert(typeof msg === 'undefined');
    });
    
    it("should log_info", () => {
        malta.verbose = 2;
        const msg = malta.log_info('info there');
        assert(console.log.calls.length === 1);
        assert(msg == 'info there');
    });
    it("should not log_info", () => {
        malta.verbose = 0;
        const msg = malta.log_info('info there');
        assert(console.log.calls.length === 0);
        assert(typeof msg === 'undefined');
    });

    it("should log_warn", () => {
        malta.verbose = 2;
        const msg = malta.log_warn('info there');
        assert(console.log.calls.length === 1);
        assert(msg == 'info there');
    });
    it("should not log_warn", () => {
        malta.verbose = 0;
        const msg = malta.log_warn('info there');
        assert(console.log.calls.length === 0);
        assert(typeof msg === 'undefined');
    });
});
