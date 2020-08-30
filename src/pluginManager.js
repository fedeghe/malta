
/* eslint-disable no-console */
const fs = require('fs'),
    path = require('path'),
    execPath = process.cwd(),
    utils = require('./utils.js');

function PluginManager (instance) {
    this.userPath = `${execPath}/plugins/`;
    this.maltaPath = `${__dirname}/../plugins/`;
    this.mself = instance;
    this.plugins = {};
    this.executor = null;
}

PluginManager.prototype.run = function () {
    const self = this,
        mself = this.mself,
        pluginKeys = Object.keys(this.plugins);
    let iterator;

    if (pluginKeys.length) mself.log_info('Starting plugins'.yellow());

    if (mself.hasPlugins) {
        mself.log_debug(`on ${mself.outName.underline()} called plugins:`);
        iterator = utils.getIterator(pluginKeys);
        this.executor = new Executor(iterator, mself, self);
        this.executor.run();
    } else {
        self.maybeNotifyBuild();
    }
};

PluginManager.prototype.maybeNotifyBuild = function (gotErrs) {
    const mself = this.mself,
        now = `${new Date()}`;
    if (mself.constructor.verbose > 0 && mself.notifyBuild) {
        mself.sticky(
            ['Malta @ ', now.replace(/(GMT.*)$/, '')].join(''),
            [
                path.basename(mself.outName),
                'build completed in',
                mself.t_end - mself.t_start,
                'ms'
            ].join(' '),
            gotErrs
        );
    }
};

PluginManager.prototype.add = function (fname, params) {
    const self = this,
        userPath = `${this.userPath}${fname}.js`,
        userPathFolder = `${this.userPath}${fname}/index.js`,
        maltaPath = `${this.maltaPath}${fname}.js`;

    let plugin;

    try {
        // first the user execution dir
        //
        if (fs.existsSync(userPath)) {
            plugin = require(userPath);

            // then check if malta package has it, in folder/index.js
            //
        } else if (fs.existsSync(userPathFolder)) {
            plugin = require(userPathFolder);

            // or in file
            //
        } else if (fs.existsSync(maltaPath)) {
            plugin = require(maltaPath);

            // otherwise most likely is available as package if installed
            //
        } else {
            plugin = require(fname);
        }
    } catch (e) {
        this.mself.log_err(`\`${fname}\` required plugin not found OR there was an error in the plugin!`);
        this.mself.log_err(e);
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

module.exports = PluginManager;
