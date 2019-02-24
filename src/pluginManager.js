const execPath = process.cwd();

const utils = require('./utils.js')


function PluginManager(tplName) {
    this.user_path = execPath + "/plugins/";
    this.malta_path = __dirname + "/../plugins/";
    this.tplName = tplName;
    this.plugins = {};
}

PluginManager.prototype.run = instance => {
};

PluginManager.prototype.add = (fname, params) => {
    const user_path = this.user_path + fname + '.js',
        malta_path = this.malta_path + fname + '.js';

    let plugin;

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
        self.log_err("`" + fname + "` required plugin not found!");
    }

    if ('ext' in plugin) {
        if (utils.isArray(plugin.ext)) {
            plugin.ext.forEach(function (ext) {
                this.doAdd(ext, plugin, params);
            });
        } else if (utils.isString(plugin.ext)) {
            this.doAdd(plugin.ext, plugin, params);
        }
    } else {
        this.doAdd('*', plugin, params);
    }
};


PluginManager.prototype.doAdd = (el, plu, params) => {
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
}

module.exports = PluginManager;


