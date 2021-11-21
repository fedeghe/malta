const fs = require('fs'),
    Malta = require('./malta'),
    elements = {},
    arrDiff = (a, b) => {
        const bAdded = [],
            bRemoved = [],
            astr = a.join(':::'),
            bstr = b.join(':::');
        let i, l;

        for (i = 0, l = a.length; i < l; i++) {
            if (bstr.indexOf(a[i]) < 0) bRemoved.push(a[i]);
        }
        for (i = 0, l = b.length; i < l; i++) {
            if (astr.indexOf(b[i]) < 0) bAdded.push(b[i]);
        }
        return { added: bAdded, removed: bRemoved };
    },
    observe  = (folder, cb, extension) => {
        const actual = {};
        let previous = false;

        // if (folder in elements) return false;

        if (!(folder in elements)) {
            elements[folder] = {};
        }
        if (!(extension in elements[folder])) {
            elements[folder][extension] = {};
        } else {
            return false;
        }

        elements[folder][extension] = setInterval(() => {
            try {
                fs.readdir(folder, function (err, files) {
                    if (err) throw err;
                    if (!files) return;

                    if (!previous) {
                        previous = {
                            files: files,
                            n: files.length,
                            time: new Date()
                        };
                    }

                    actual.files = files;
                    actual.n = files.length;

                    if (previous.files.length !== actual.files.length) {
                        actual.time = new Date();

                        cb(arrDiff(previous.files, actual.files), extension);
                    }
                    previous.files = actual.files;
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                Malta.log_debug(err);
                process.exit();
            }
        }, 100);

        return true;
    },
    unobserve = (folder, extension) => {
        if (folder in elements) {
            if (extension in elements[folder]) {
                clearInterval(elements[folder][extension]);
                delete elements[folder][extension];
                return true;
            }
        }
        return false;
    };


module.exports = {
    observe,
    unobserve
};
