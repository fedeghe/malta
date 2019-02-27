const fs = require('fs'),
    path = require('path');

const execPath = process.cwd();
const utils = require('./utils.js');

function PluginManager() {
    this.user_path = execPath + "/plugins/";
    this.malta_path = __dirname + "/../plugins/";
    this.plugins = {};
}

PluginManager.prototype.run = function (instance, Malta) {
    const self = this;
    const mself = instance;
    const pluginKeys = Object.keys(self.plugins);

    if (pluginKeys.length) mself.log_info('Starting plugins'.yellow());

    if (mself.hasPlugins) {
        mself.log_debug('on ' + mself.outName.underline() + ' called plugins:');
        plugin4ext(utils.getIterator(pluginKeys));
    } else {
        maybeNotifyBuild();
    }


    function plugin4ext(extIterator) {

        (function checknext() {
            if (extIterator.hasNext()) {
                const ext = extIterator.next(),
                    pins = self.plugins[ext];

                // if ends with the extension
                //    ----
                if (mself.outName.match(new RegExp(".*\\." + ext + '$'))) {

                    let iterator = utils.getIterator(pins);

                    (function go() {

                        let res,
                            pl;

                        if (iterator.hasNext()) {
                            pl = iterator.next();
                            res = callPlugin(pl);
                            if (res) {
                                (new Promise(res)).then(function (obj) {
                                    if (mself.userWatch) mself.userWatch.call(mself, obj, pl);
                                    mself.data.name = obj.name;

                                    // replace the name given by the plugin fo the file
                                    // produced and to be passed to the next plugin
                                    //
                                    mself.data.content = "" + obj.content;
                                    go();
                                }).catch(function (msg) {
                                    console.log(`Plugin '${pl.name}' error: `);
                                    console.log("\t" + msg);
                                    Malta.stop();
                                });
                            } else {
                                go();
                            }
                        } else {
                            plugin4ext(extIterator);
                        }
                    })();
                } else {
                    checknext();
                }
            } else {
                if (typeof mself.endCb === 'function') mself.endCb();
                maybeNotifyBuild();
            }
        })();
    }

    function maybeNotifyBuild() {
        // console.log('✅') //
        if (Malta.verbose > 0 && mself.notifyBuild) {
            mself.sticky(
                "Malta @ " + ("" + new Date()).replace(/(GMT.*)$/, ''),
                path.basename(mself.outName) + " build completed in " + (mself.t_end - mself.t_start) + "ms"
            );
        }
    }

    function callPlugin(p) {
        mself.log_debug('> ' + p.name.yellow() + (p.params ? ' called passing ' + JSON.stringify(p.params).darkgray() : ''));

        mself.doBuild = true;
        // actually I dont` need to pass data, since it can be retrieved by the context,
        // but is better (and I don`t have to modify every plugin and the documentation)
        //
        return p.func.bind(mself)(mself.data, p.params);
    }
};

PluginManager.prototype.require = function (fname) {
    let plugin;
    const user_path = this.user_path + fname + '.js',
        malta_path = this.malta_path + fname + '.js';
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
            params: params
        });
    }
};

module.exports = PluginManager;
