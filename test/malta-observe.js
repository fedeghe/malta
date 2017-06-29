var fs = require('fs'),
    path = require('path');

describe('folder observing', function () {
    var trgFolder = path.resolve(path.dirname(__filename) + '/tmp/observed');

    before(function(){
        ob = require('../src/observe');
    })
    after(function(){
        // fs.unlink(trgFolder + '/message1.txt', (err) => {
        //     if (err) throw err;
        // });
        // fs.unlink(trgFolder + '/message2.txt', (err) => {
        //     if (err) throw err;
        // });
    })

    it('observe function add', function (done) {
        ob.observe(trgFolder, function () {
            console.assert(arguments[0].added.length === 1);
            console.assert(arguments[0].removed.length === 0);
            ob.unobserve(trgFolder)
            done()
        });

        setTimeout(function () {
            fs.writeFile(trgFolder + '/message1.txt', 'Hello Node.js', (err) => {
                if (err) throw err;
            });    
        }, 100)
    });


    it('observe function remove', function (done) {
        ob.observe(trgFolder, function () {
            console.assert(arguments[0].added.length === 0);
            console.assert(arguments[0].removed.length === 1);
            ob.unobserve(trgFolder)
            done()
        });

        setTimeout(function () {
            fs.unlink(trgFolder + '/message1.txt', (err) => {
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
            fs.writeFile(trgFolder + '/message2.txt', 'Hello Node.js', (err) => {
                if (err) throw err;
                setTimeout(function (){
                    fs.unlink(trgFolder + '/message2.txt', (err) => {
                        if (err) throw err;
                        done();
                    });    
                }, 100)
                
            });    
        }, 100)
    });


});