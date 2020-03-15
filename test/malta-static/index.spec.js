const assert = require('assert'),
    malta = require('../../src/index.js');

describe('static methods', () => {
    it("should get a malta instance", () => {
        let m = malta.get();
        assert(m instanceof malta, true);
    });
});
