const path = require('path'),
    fs = require('fs');

function testPlugin1(obj, options) {
    const self = this,
        start = new Date(),
        pluginName = path.basename(path.dirname(__filename));

    let msg;
    options = options || {name: 'flat'};
    obj.name = obj.name.replace(/\.json$/, `.${options.name}.json`);

    return (solve, reject) => {
        const content = obj.content.replace(/\n/gm, '').replace(/\s/g, '');
        fs.writeFile(obj.name, content, err => {
            if (err == null) {
                msg = 'plugin ' + pluginName.white() + ' wrote ' + obj.name + ' (' + self.getSize(obj.name) + ')';
            } else {
                console.log('[ERROR] '.red() + pluginName + ' says:');
                console.dir(err);
                reject(err);
                self.stop();
            }
            solve(obj);
            self.notifyAndUnlock(start, msg);
        });
    }
}
testPlugin1.ext = 'json';
module.exports = testPlugin1;