const fs = require('fs'),
    path = require('path'),
    Malta = require('./malta.js'),
    execPath = process.cwd();

const utils = require('./utils.js');

function PluginManager (instance) {
    this.userPath = `${execPath}/plugins/`;
    this.maltaPath = `${__dirname}/../plugins/`;
    this.mself = instance;
    this.plugins = {};
}

PluginManager.prototype.run = function () {
    const self = this,
        mself = this.mself,
        pluginKeys = Object.keys(this.plugins);
    let iterator;

    if (pluginKeys.length) mself.log_info('Starting plugins'.yellow());

    if (mself.hasPlugins) {
        mself.log_debug('on ' + mself.outName.underline() + ' called plugins:');
        iterator = utils.getIterator(pluginKeys);
        plugin4ext(iterator);
    } else {
        maybeNotifyBuild();
    }

    function plugin4ext (extIterator) {
        (function checknext () {
            if (extIterator.hasNext()) {
                const ext = extIterator.next(),
                    pins = self.plugins[ext] || [];

                // if ends with the extension
                //    ----
                if (mself.outName.match(new RegExp(`.*\\.${ext}$`))) {
                    let iterator = utils.getIterator(pins);
                    (function go () {
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
                                    mself.data.content = `${obj.content}`;
                                    go();
                                }).catch(function (msg) {
                                    console.log(`Plugin '${pl.name}' error: `);
                                    console.log(Malta.TAB + msg);
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

    function maybeNotifyBuild () {
        if (Malta.verbose > 0 && mself.notifyBuild) {
            mself.sticky(
                `Malta @ ${(new Date()).replace(/(GMT.*)$/, '')}`,
                [
                    path.basename(mself.outName),
                    'build completed in',
                    mself.t_end - mself.t_start,
                    'ms'
                ].join(' ')
            );
        }
    }

    function callPlugin (p) {
        mself.log_debug('> ' + p.name.yellow() + (p.params ? ' called passing ' + JSON.stringify(p.params).darkgray() : ''));

        mself.doBuild = true;
        // actually I dont` need to pass data, since it can be retrieved by the context,
        // but is better (and I don`t have to modify every plugin and the documentation)
        //
        return p.func.bind(mself)(mself.data, p.params);
    }
};

PluginManager.prototype.add = function(fname, params) {

    const self = this,
        userPath = `${this.userPath}${fname}.js`,
        maltaPath = `${this.maltaPath}${fname}.js`;

    let plugin;

    try {
        // first the user execution dir
        //
        if (fs.existsSync(userPath)) {
            plugin = require(userPath);

            // then check if malta package has it
            //
        } else if (fs.existsSync(maltaPath)) {
            plugin = require(maltaPath);

            // otherwise most likely is available as package if installed
            //
        } else {
            plugin = require(fname);
        }
    } catch (e) {
        console.log(e);
        this.mself.log_err(`\`${fname}\` required plugin not found!`);
    }

    if ('ext' in plugin) {
        if (utils.isArray(plugin.ext)) {
            plugin.ext.forEach(function (ext) {
                self.doAdd(ext, plugin, params);
            });
        } else if (utils.isString(plugin.ext)) {
            this.doAdd(plugin.ext, plugin, params);
        }
    } else {
        this.doAdd('*', plugin, params);
    }
};

PluginManager.prototype.doAdd = function (el, plu, params) {
    // handle * wildcard
    el = el === '*' ? this.mself.tplName.split('.').pop() : el;

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
