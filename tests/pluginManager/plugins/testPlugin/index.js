const path = require('path'),
    fs = require('fs');

function testPlugin(obj, options) {
    const self = this,
        start = new Date(),
        pluginName = path.basename(path.dirname(__filename));

    let msg;
    options = options || {name: 'flat'};
    obj.name = obj.name.replace(/\.json$/, `.${options.name}.json`);

    return (solve, reject) => {
        const content = obj.content.replace(/\n/gm, '').replace(/\s/g, '');
        try {
            // Keep this test plugin deterministic for CLI child-process tests.
            fs.writeFileSync(obj.name, content);
            msg = 'plugin ' + pluginName.white() + ' wrote ' + obj.name + ' (' + self.getSize(obj.name) + ')';
            solve(obj);
            self.notifyAndUnlock(start, msg);
        } catch (err) {
            console.log('[ERROR] '.red() + pluginName + ' says:');
            console.dir(err);
            reject(err);
            self.stop();
        }
    }
}
testPlugin.ext = 'json';
module.exports = testPlugin;
