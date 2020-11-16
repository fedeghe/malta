const path = require('path'),
    fs = require('fs');

function myplugin2(obj, options) {
    const self = this,
        start = new Date(),
        pluginName = path.basename(path.dirname(__filename));
    let msg;
    options = options || {};
    return (solve, reject) => {
        setTimeout(() => {
            obj.content = `//>> ${options.name}\n${obj.content}`;
            solve(obj);
            self.notifyAndUnlock(start, msg);
        }, 100);
    }
}

myplugin2.ext = 'js';
module.exports = myplugin2;