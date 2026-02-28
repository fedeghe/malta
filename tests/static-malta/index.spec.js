const malta = require('../../src/index.js');

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
        expect(m instanceof malta).toBe(true);
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
        const ret = malta.getRunsFromPath('#tests/static-malta/getRunsFromPath.json');
        Object.keys(ret).length && done();
    });

    it("should log_debug", () => {
        malta.verbose = 2;
        const msg = malta.log_debug('my debug');
        expect(console.log.calls.length).toBe(1);
        expect(msg).toBe('my debug');
    });
    it("should not log_debug", () => {
        malta.verbose = 0;
        const msg = malta.log_debug('my debug');
        expect(console.log.calls.length).toBe(0);
        expect(typeof msg).toBe('undefined');
    });

    it("should log_err", () => {
        malta.verbose = 2;
        const msg = malta.log_err('my error', 'my error message');
        expect(console.log.calls.length).toBe(3);
        expect(msg.length).toBeGreaterThan(0);
        expect(msg).toBe('my error message');
    });
    it("should not log_err", () => {
        malta.verbose = 0;
        const msg = malta.log_err('my error');
        expect(console.log.calls.length).toBe(0);
        expect(typeof msg).toBe('undefined');
    });

    it("should log_dir", () => {
        malta.verbose = 2;
        const msg = malta.log_dir({dir: 'there'});
        expect(console.log.calls.length).toBe(1);
        expect(msg).toBe(JSON.stringify({"dir":"there"}));
    });
    it("should not log_dir", () => {
        malta.verbose = 0;
        const msg = malta.log_dir({dir: 'there'});
        expect(console.log.calls.length).toBe(0);
        expect(typeof msg).toBe('undefined');
    });
    
    it("should log_info", () => {
        malta.verbose = 2;
        const msg = malta.log_info('info there');
        expect(console.log.calls.length).toBe(1);
        expect(msg).toBe('info there');
    });
    it("should not log_info", () => {
        malta.verbose = 0;
        const msg = malta.log_info('info there');
        expect(console.log.calls.length).toBe(0);
        expect(typeof msg).toBe('undefined');
    });

    it("should log_warn", () => {
        malta.verbose = 2;
        const msg = malta.log_warn('info there');
        expect(console.log.calls.length).toBe(1);
        expect(msg).toBe('info there');
    });
    it("should not log_warn", () => {
        malta.verbose = 0;
        const msg = malta.log_warn('info there');
        expect(console.log.calls.length).toBe(0);
        expect(typeof msg).toBe('undefined');
    });
});
