const assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    ob = require('../../src/observe'),
    folder = path.dirname(__filename);

describe('folder observing', function () {
    const observed = `${folder}/observed`;

    it('observe function add', function (done) {
        ob.observe(observed, function (a) {
            assert.equal(a.added.length, 1);
            assert.equal(a.removed.length, 0);
            ob.unobserve(observed);
            done();
        });
        setTimeout(function () {
            fs.writeFile(observed + '/message1.txt', 'Hello Node.js', function (err) {
                if (err) throw err;
            });    
        }, 300)
    });


    it('observe function remove', function (done) {
        
        ob.observe(observed, function (a) {
            assert.equal(a.added.length, 0);
            assert.equal(a.removed.length, 1);
            ob.unobserve(observed, 'txt')
            done()
        }, 'txt');
        setTimeout(function () {
            fs.unlink(observed + '/message1.txt', function (err) {
                if (err) throw err;
            });    
        }, 300)
    });

    it('unobserve function', function (done) {
        ob.observe(observed, function () {
            throw {};
        }, 'txt');
        
        ob.unobserve(observed, 'txt');

        setTimeout(function () {
            fs.writeFile(observed + '/message2.txt', 'Hello Node.js', function (err) {
                if (err) throw err;
                setTimeout(function (){
                    fs.unlink(observed + '/message2.txt', function (err) {
                        if (err) throw err;
                        done();
                    });    
                }, 100)
            });    
        }, 100)
    });
});