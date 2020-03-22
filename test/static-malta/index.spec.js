const assert = require('assert'),
    malta = require('../../src/index.js');

describe('static methods', () => {
    it("should get a malta instance", () => {
        let m = malta.get();
        assert(m instanceof malta, true);
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
        try{
            malta.checkExec('java', (err) => {
                !err && done()
            });
        } catch(e) {
            // console.log('Comes here then an error is rethrown')
            // throw e;
        }
        
    });
    it("should check non existent executable", done => {
        malta.checkExec('javazzzzz', (err) => {
            err && done()
        });
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
        assert(msg === 'my debug');
    });
    it("should not log_debug", () => {
        malta.verbose = 0;
        const msg = malta.log_debug('my debug');
        assert(typeof msg === 'undefined');
    });

    it("should log_err", () => {
        malta.verbose = 2;
        const msg = malta.log_err('my error');
        assert(msg.length > 0);
    });
    it("should not log_err", () => {
        malta.verbose = 0;
        const msg = malta.log_err('my error');
        assert(typeof msg === 'undefined');
    });

    it("should log_dir", () => {
        malta.verbose = 2;
        const msg = malta.log_dir({dir: 'there'});
        assert(msg == JSON.stringify({"dir":"there"}));
    });
    it("should not log_dir", () => {
        malta.verbose = 0;
        const msg = malta.log_dir({dir: 'there'});
        assert(typeof msg === 'undefined');
    });
    
    it("should log_info", () => {
        malta.verbose = 2;
        const msg = malta.log_info('info there');
        assert(msg == 'info there');
    });
    it("should not log_info", () => {
        malta.verbose = 0;
        const msg = malta.log_info('info there');
        assert(typeof msg === 'undefined');
    });

    it("should log_warn", () => {
        malta.verbose = 2;
        const msg = malta.log_warn('warn there');
        assert(msg == 'warn there');
    });
    it("should not log_warn", () => {
        malta.verbose = 0;
        const msg = malta.log_warn('warn there');
        assert(typeof msg === 'undefined');
    });

});
