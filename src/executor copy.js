/* eslint-disable no-console */
const utils = require('./utils.js');

function Executor (iterator, maltaInstance, pmInstance) {
    this.iterator = iterator;
    this.malta = maltaInstance;
    this.pm = pmInstance;
}

Executor.prototype.run = function () {
    const self = this,
        malta = this.malta;

    if (this.iterator.hasNext()) {
        const ext = this.iterator.next(),
            pins = self.pm.plugins[ext] || [];

        if (malta.outName.match(new RegExp(`.*\\.${ext}$`))) {
            const iterator = utils.getIterator(pins);
            (function go () {
                let res,
                    pl;

                if (iterator.hasNext()) {
                    pl = iterator.next();
                    res = self.callPlugin(pl);
                    if (res) {
                        (new Promise(res)).then(function (obj) {
                            if (malta.userWatch) malta.userWatch.call(malta, obj, pl);
                            malta.data.name = obj.name;

                            // replace the name given by the plugin fo the file
                            // produced and to be passed to the next plugin
                            //
                            malta.data.content = `${obj.content}`;
                            go();
                        }).catch(function (msg) {
                            self.pm.maybeNotifyBuild({ gotErrs: msg });
                            malta.log_debug(`Plugin '${pl.name}' error: `);
                            // console.log(Malta.TAB + msg);
                            malta.log_debug(msg);
                            go();
                            // malta.stop();
                        });
                    } else {
                        go();
                    }
                } else {
                    self.run();
                }
            })();
        } else {
            self.run();
        }
    } else {
        if (typeof malta.endCb === 'function') malta.endCb(malta.data);
        self.pm.maybeNotifyBuild();
    }
};

Executor.prototype.callPlugin = function (p) {
    const malta = this.malta;
    malta.log_debug([
        '> ',
        p.name.yellow(),
        (p.params ? `called passing ${JSON.stringify(p.params).darkgray()}` : '')
    ].join(''));

    malta.doBuild = true;
    // actually I dont` need to pass data, since it can be retrieved by the context,
    // but is better (and I don`t have to modify every plugin and the documentation)
    //
    return p.func.bind(malta)(malta.data, p.params);
};

module.exports = Executor;
