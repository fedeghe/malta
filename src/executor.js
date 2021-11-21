
const utils = require('./utils.js');

class Executor {
    constructor (iterator, maltaInstance, pmInstance) {
        this.iterator = iterator;
        this.malta = maltaInstance;
        this.pm = pmInstance;
    }

    run () {
        const malta = this.malta,
            self = this;

        if (this.iterator.hasNext()) {
            const ext = this.iterator.next(),
                pins = this.pm.plugins[ext] || [];

            if (malta.outName.match(new RegExp(`.*\\.${ext}$`))) {
                const iterator = utils.getIterator(pins);
                (function go () {
                    let res,
                        pl;

                    if (iterator.hasNext()) {
                        pl = iterator.next();
                        res = self.callPlugin(pl);
                        if (res) {
                            (new Promise(res)).then(obj => {
                                if (malta.userWatch) malta.userWatch.call(malta, obj, pl);
                                malta.data.name = obj.name;

                                // replace the name given by the plugin fo the file
                                // produced and to be passed to the next plugin
                                //
                                malta.data.content = `${obj.content}`;
                                go();
                            }).catch(msg => {
                                self.pm.maybeNotifyBuild({ gotErrs: msg });
                                malta.log_debug(`Plugin '${pl.name}' error: `);
                                malta.log_debug(msg);
                                go();
                            });
                        } else {
                            go();
                        }
                    } else {
                        self.run();
                    }
                })();
            } else {
                this.run();
            }
        } else {
            if (typeof malta.endCb === 'function') malta.endCb(malta.data);
            this.pm.maybeNotifyBuild();
        }
    }

    callPlugin (p) {
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
    }
}

module.exports = Executor;
