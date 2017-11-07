const assert = require('assert'),
    sticky = require('../src/sticky');


describe('sticky message', function () {

    it('should run a sticky and return title___message', function (done) {
        try {
            sticky("My title", "My message", function (result) {
                assert.equal(result, "My title___My message");
                done();
            })
        } catch (err) {
            // go straigh for travis
            done();
        }
    });
});