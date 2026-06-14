const fs = require('fs'),
    path = require('path'),
    ob = require('../../src/observe'),
    Malta = require('../../src/malta'),
    folder = path.dirname(__filename);

describe('folder observing', function () {
    const observed = `${folder}/observed`;

    it('observe function add', function (done) {
        ob.observe(observed, function (a) {
            expect(a.added.length).toBe(1);
            expect(a.removed.length).toBe(0);
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
            expect(a.added.length).toBe(0);
            expect(a.removed.length).toBe(1);
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

    it('should return false for unobserve on unknown folder', function () {
        expect(ob.unobserve('nonexistent')).toBe(false);
    });

    it('should return false for unobserve on unknown extension', function () {
        ob.observe(observed, () => {}, 'txt');
        expect(ob.unobserve(observed, 'css')).toBe(false);
        ob.unobserve(observed, 'txt');
    });

    it('should handle readdir error gracefully', function (done) {
        const readdirSpy = jest.spyOn(fs, 'readdir').mockImplementation((dir, cb) => cb(new Error('fail')));
        const logSpy = jest.spyOn(Malta, 'log_debug').mockImplementation(() => {});
        ob.observe(observed, () => {}, 'txt');
        setTimeout(() => {
            expect(logSpy).toHaveBeenCalledWith(expect.any(Error));
            logSpy.mockRestore();
            readdirSpy.mockRestore();
            ob.unobserve(observed, 'txt');
            done();
        }, 150);
    });
});
