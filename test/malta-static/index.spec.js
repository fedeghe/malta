var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    malta = require('../../src/index.js'),
    folder = path.dirname(__filename),
    doneFunc = require('../utils').doneFunc;

describe('static methods', () => {
    let m;
    it("should get a malta instance", () => {
        m = malta.get();
        assert(m instanceof malta, true);
    });
});