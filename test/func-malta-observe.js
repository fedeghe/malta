var assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('folder observing', function () {
    var trgFolder = path.resolve(path.dirname(__filename) + '/fs/observed'),
        ob;

    before(function(){
        ob = require('../src/observe');
    })
    after(function(){
        // fs.unlink(trgFolder + '/message1.txt', function (err) {
        //     if (err) throw err;
        // });
        // fs.unlink(trgFolder + '/message2.txt', function (err) {
        //     if (err) throw err;
        // });
    })

    it('observe function add', function (done) {
        ob.observe(trgFolder, function (a) {
            assert.equal(a.added.length, 1);
            assert.equal(a.removed.length, 0);
            ob.unobserve(trgFolder);
            done();
        });
        setTimeout(function () {
            fs.writeFile(trgFolder + '/message1.txt', 'Hello Node.js', function (err) {
                if (err) throw err;
            });    
        }, 100)
    });


    it('observe function remove', function (done) {
        ob.observe(trgFolder, function (a) {
            assert.equal(a.added.length, 0);
            assert.equal(a.removed.length, 1);
            ob.unobserve(trgFolder)
            done()
        });
        setTimeout(function () {
            fs.unlink(trgFolder + '/message1.txt', function (err) {
                if (err) throw err;
            });    
        }, 100)
    });

    it('unobserve function', function (done) {
        ob.observe(trgFolder, function () {
            throw {};
        });
        
        ob.unobserve(trgFolder);

        setTimeout(function () {
            fs.writeFile(trgFolder + '/message2.txt', 'Hello Node.js', function (err) {
                if (err) throw err;
                setTimeout(function (){
                    fs.unlink(trgFolder + '/message2.txt', function (err) {
                        if (err) throw err;
                        done();
                    });    
                }, 100)
            });    
        }, 100)
    });
});