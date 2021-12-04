/* eslint-disable no-console */
const fs = require('fs'),
    path = require('path'),
    Executor = require('./executor'),
    execPath = process.cwd(),
    utils = require('./utils.js');
    
class PluginManager {
    constructor (instance) {
        this.userPath = `${execPath}/plugins/`;
        this.maltaPath = `${__dirname}/../plugins/`;
        this.mself = instance;
        this.plugins = {};
        this.executor = null;
    }

    run () {
        const mself = this.mself,
            pluginKeys = Object.keys(this.plugins);
        let iterator;

        if (pluginKeys.length) mself.log_info('Starting plugins'.yellow());

        if (mself.hasPlugins) {
            mself.log_debug(`on ${mself.outName.underline()} called plugins:`);
            iterator = utils.getIterator(pluginKeys);
            this.executor = new Executor(iterator, mself, this);
            this.executor.run();
        } else {
            this.maybeNotifyBuild();
        }
    }

    maybeNotifyBuild (gotErrs) {
        const mself = this.mself,
            now = `${new Date()}`;
        if (mself.constructor.verbose > 0 && mself.notifyBuild) {
            mself.sticky(
                ['Malta @ ', now.replace(/(GMT.*)$/, '')].join(''), [
                    path.basename(mself.outName),
                    'build completed in',
                    mself.t_end - mself.t_start,
                    'ms'
                ].join(' '),
                gotErrs
            );
        }
    }

    add (fname, params) {
        const userPath = `${this.userPath}${fname}.js`,
            userPathFolder = `${this.userPath}${fname}/index.js`,
            maltaPath = `${this.maltaPath}${fname}.js`,
            self = this;

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
                plugin.ext.forEach(ext => self.doAdd(ext, plugin, params));
            } else if (utils.isString(plugin.ext)) {
                this.doAdd(plugin.ext, plugin, params);
            }
        } else {
            this.doAdd('*', plugin, params);
        }
    }

    doAdd (el, plu, params) {
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
    }
}

module.exports = PluginManager;
