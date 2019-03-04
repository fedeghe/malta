const fs = require('fs'),
    path = require('path'),
    execPath = process.cwd(),
    utils = require('./utils.js'),
    // eslint-disable-next-line quotes
    TAB = "\t";

function PluginManager() {
    this.user_path = `${execPath}/plugins/`;
    this.malta_path = `${__dirname}/../plugins/`;
    this.plugins = {};
}

PluginManager.prototype.run = function (instance, Malta) {
    const self = this,
        pluginKeys = Object.keys(self.plugins);
    this.mself = instance;
    this.Malta = Malta;

    if (pluginKeys.length) self.mself.log_info('Starting plugins'.yellow());

    if (self.mself.hasPlugins) {
        self.mself.log_debug(`on ${self.mself.outName.underline()} called plugins:`);
        self.plugin4ext(utils.getIterator(pluginKeys));
    } else {
        self.maybeEndCbAndNotifyBuild();
    }
};

PluginManager.prototype.maybeEndCbAndNotifyBuild = function () {
    if (typeof this.mself.endCb === 'function') {
        this.mself.endCb.call(this.mself);
    }
    this.maybeNotifyBuild();
};

PluginManager.prototype.plugin4ext = function (extIterator) {
    const self = this;
    (function checknext() {
        if (extIterator.hasNext()) {
            const ext = extIterator.next(),
                pins = self.plugins[ext];

            // if ends with the extension
            //    ----
            if (self.mself.outName.match(new RegExp([ '.*\\.', ext, '$' ].join('')))) {
                let iterator = utils.getIterator(pins);

                (function go() {

                    let res, pl;

                    if (iterator.hasNext()) {
                        pl = iterator.next();
                        res = self.callPlugin(pl);
                        if (res) {
                            (new Promise(res)).then(function (obj) {
                                if (self.mself.userWatch) self.mself.userWatch.call(self.mself, obj, pl);
                                self.mself.data.name = obj.name;

                                // replace the name given by the plugin fo the file
                                // produced and to be passed to the next plugin
                                //
                                self.mself.data.content = `${obj.content}`;
                                go();
                            }).catch(function (msg) {
                                console.log(`Plugin '${pl.name}' error: `);
                                console.log(`${TAB}${msg}`);
                                self.Malta.stop();
                            });
                        } else {
                            go();
                        }
                    } else {
                        self.plugin4ext(extIterator);
                    }
                })();
            } else {
                checknext();
            }
        } else {
            self.maybeEndCbAndNotifyBuild();
        }
    })();
};

PluginManager.prototype.maybeNotifyBuild = function () {
    const self = this;
    // console.log('✅') //
    if (self.Malta.verbose > 0 && self.mself.notifyBuild) {
        let t = self.mself.t_end - self.mself.t_start;
        self.mself.sticky(
            [ 'Malta @ ', `${new Date()}`.replace(/(GMT.*)$/, '') ].join(''),
            `${path.basename(self.mself.outName)} build completed in ${t}ms`
        );
    }
};

PluginManager.prototype.callPlugin = function (p) {
    const self = this;
    self.mself.log_debug(`> ${p.name.yellow()} ${p.params ? ` called passing ${JSON.stringify(p.params).darkgray()}` : ''}`);

    self.mself.doBuild = true;
    // actually I dont` need to pass data, since it can be retrieved by the context,
    // but is better (and I don`t have to modify every plugin and the documentation)
    //
    return p.func.bind(self.mself)(self.mself.data, p.params);
};


PluginManager.prototype.require = function (fname) {
    let plugin;
    const user_path = `${this.user_path}${fname}.js`,
        malta_path = `${this.malta_path}${fname}.js`;
    try {
        // first the user execution dir
        //`
        if (fs.existsSync(user_path)) {
            plugin = require(user_path);
            // then check if malta package has it
            //
        } else if (fs.existsSync(malta_path)) {
            plugin = require(malta_path);

            // otherwise most likely is available as package if installed
            //
        } else {
            plugin = require(fname);
        }
    } catch (e) {
        console.log(e);
    }
    return plugin;
};


PluginManager.prototype.add = function (fname, params) {

    const self = this;
    let plugin = self.require(fname);

    if ('ext' in plugin) {
        if (utils.isArray(plugin.ext)) {
            plugin.ext.forEach(function (ext) {
                self.doAdd(ext, plugin, params);
            });
        } else if (utils.isString(plugin.ext)) {
            self.doAdd(plugin.ext, plugin, params);
        }
    } else {
        self.doAdd('*', plugin, params);
    }
};


PluginManager.prototype.doAdd = function(el, plu, params) {
    // handle * wildcard
    el = el === '*' ? this.tplName.split('.').pop() : el;

    if (!(el in this.plugins)) {
        this.plugins[el] = [];
    }
    if (!(plu.name in this.plugins[el])) {
        this.plugins[el].push({
            name: plu.name,
            func: plu,
            params
        });
    }
};

module.exports = PluginManager;
