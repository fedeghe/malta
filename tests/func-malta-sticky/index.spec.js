const os = require('os'),
    childProcess = require('child_process'),
    sticky = require('../../src/sticky');

describe('sticky notifications', function () {
    let execSpy;

    beforeEach(() => {
        execSpy = jest.spyOn(childProcess, 'exec').mockImplementation((cmd, cb) => {
            if (cb) cb(null);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call testcb on success', function (done) {
        sticky('Title', 'Message', undefined, (res) => {
            expect(res).toBe('Title___Message');
            done();
        });
        setTimeout(() => {
            expect(execSpy).toHaveBeenCalled();
        }, 10);
    });

    it('should use failure icon and sound when errs are present', function (done) {
        sticky('Title', 'Message', 'some error', (res) => {
            expect(res).toBe('Title___Message');
            done();
        });
        setTimeout(() => {
            expect(execSpy).toHaveBeenCalled();
        }, 10);
    });

    it('should not notify if executable is not found', function (done) {
        jest.spyOn(childProcess, 'exec').mockImplementation((cmd, cb) => {
            if (cb) cb(new Error('not found'));
        });
        const cb = jest.fn();
        sticky('Title', 'Message', undefined, cb);
        setTimeout(() => {
            expect(cb).not.toHaveBeenCalled();
            done();
        }, 10);
    });

    it('should log error if notification command fails', function (done) {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        let callCount = 0;
        jest.spyOn(childProcess, 'exec').mockImplementation((cmd, cb) => {
            callCount++;
            if (callCount === 1) {
                // which succeeds
                cb(null);
            } else {
                // actual command fails
                cb(new Error('exec failed'));
            }
        });
        sticky('Title', 'Message');
        setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
            consoleSpy.mockRestore();
            done();
        }, 10);
    });

    it('should skip on unsupported platform', function (done) {
        jest.resetModules();
        jest.doMock('os', () => ({ platform: () => 'freebsd' }));
        const freshSticky = require('../../src/sticky');
        const cb = jest.fn();
        freshSticky('Title', 'Message', undefined, cb);
        setTimeout(() => {
            expect(cb).not.toHaveBeenCalled();
            jest.dontMock('os');
            done();
        }, 10);
    });
});
