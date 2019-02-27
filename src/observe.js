const fs = require('fs');

module.exports = (function() {
    "use strict";
    let elements = {};

    function arrDiff(a, b) {
        let b_added = [],
            b_removed = [],
            astr = a.join(':::'),
            bstr = b.join(':::'),
            i, l;

        for (i = 0, l = a.length; i < l; i++) {
            if (bstr.indexOf(a[i]) < 0) b_removed.push(a[i]);
        }
        for (i = 0, l = b.length; i < l; i++) {
            if (astr.indexOf(b[i]) < 0) b_added.push(b[i]);
        }
        return {added : b_added, removed : b_removed};
    }

    function observe(folder, cb) {

        let actual = {},
            previous = false;

        if (folder in elements) return false;

        elements[folder] = setInterval(function() {
            try {
                fs.readdir(folder, function(err, files) {
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

                        cb(arrDiff(previous.files, actual.files));
                    }
                    previous.files = actual.files;
                });
            } catch (err) {
                console.log(err);
                process.exit();
            }
        }, 100);

        return true;
    }

    function unobserve(folder) {
        if (folder in elements) {
            clearInterval(elements[folder]);
            delete elements[folder];
            return true;
        }
        return false;
    }

    return {
        observe: observe,
        unobserve: unobserve
    };
})();
