const path = require('path'),
    fs = require('fs'),
    colors = require('../../src/colors');

function myplugin(obj, options) {
    const self = this,
        start = new Date(),
        pluginName = path.basename(path.dirname(__filename));
    let msg;
    options = options || {};
    return (solve, reject) => {
        setTimeout(() => {
            obj.content = `// ${options.name}\n${obj.content}`;
            fs.writeFile(obj.name, obj.content, err => {
                if (err == null) {
                    msg = 'plugin ' + colors.white(pluginName) + ' wrote ' + obj.name +' (' + self.getSize(obj.name) + ')';
                } else {
                    console.log(colors.red('[ERROR] ') + pluginName + ' says:');
                    console.dir(err);
                    self.stop();
                }
                solve(obj);
                self.notifyAndUnlock(start, msg);
            });
        }, 1000);
    }
}

myplugin.ext = 'js';
module.exports = myplugin;