const fs = require('fs'),
    Malta = require('./malta'),
    elements = {},
    DEFAULT_INTERVAL = 500,
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
                    if (err) {
                        Malta.log_debug(err);
                        return;
                    }
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
                Malta.log_debug(err);
            }
        }, DEFAULT_INTERVAL);

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
