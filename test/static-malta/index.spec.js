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
            console.err(e)
        }
        finally {
            done();
        }
    });
    it("should check executable", done => {
        try{
            malta.checkExec('java');
        } catch(e) {
            console.err(e)
        }
        finally {
            done();
        }
    });
    it("should check non existent executable", done => {
        try{
            malta.checkExec('javazzzzz')
        } catch(e) {
            done()
        }
    });
    
    it("should get runs from path", done => {
        const ret = malta.getRunsFromPath('package.json');
        Object.keys(ret).length && done()
    });

    it("should get runs from path no demon", done => {
        const ret = malta.getRunsFromPath('#test/static-malta/getRunsFromPath.json');
        Object.keys(ret).length && done()
    });

});
