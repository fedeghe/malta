#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs'),
    path = require('path'),
    childProcess = require('child_process'),
    vm = require('vm'),
    utils = require('./utils.js'),
    PluginManager = require('./pluginManager.js'),
    Sticky = require('./sticky.js'),
    execPath = process.cwd(),
    packageInfo = fs.existsSync(path.join(__dirname, '../package.json'))
        ? require(path.join(__dirname, '../package.json'))
        : {},
    execPackageInfo = fs.existsSync(`${execPath}/package.json`)
        ? require(`${execPath}/package.json`)
        : {},
    DS = path.sep,
    NL = '\n',
    TAB = '\t',
    UNDEFINED = 'undefined',
    getCommentFn = (pre, post) => cnt => pre + cnt + post,
    objMultiKey = o => {
        const ret = {};
        let i, j, jl, ks;
        for (i in o) {
            if (!Object.prototype.hasOwnProperty.call(o, i)) continue;
            ks = i.split('|');
            for (j = 0, jl = ks.length; j < jl; j++) ret[ks[j]] = o[i];
        }
        return ret;
    };

// string proto for console colors
const colors = require('./colors');

/**
 * Malta is the main object that will watch for modifications and build when needed
 *
 * @constructor Malta
 * @class      Malta (name)
 * @return     {Object}  The instance of Malta
 */
function Malta () {
    if (!Malta.instances) Malta.instances = [];
    Malta.instances.push(this);
    this.args = [];

    /**
     * security nesting level
     */
    this.MAX_INVOLVED = 5E3;

    /**
     * name and version from package json
     */
    this.buildnumber = null;

    /**
     * path for the vars.json
     */
    this.varPath = '';

    /**
     * register for the content of vars.json, if found
     */
    this.vars = {};

    /**
     * variables found in a package.json file, if present
     */
    this.execPackageVars = {};

    /**
     * basename for the base template, path and content
     */
    this.tplName = '';
    this.tplPath = '';
    this.tplCnt = '';

    /**
     * base dir from where placeholder will start
     * will be always equal to the base template folder
     */
    this.baseDir = '';

    // output directory written files
    //
    this.outDir = '';

    /**
     * execution directory
     */
    this.execDir = '';

    /**
     * names for in/out files
     */
    this.inName = '';
    this.outName = '';

    /**
     * to store the last involved file while parsing,
     * used to have more info when an exception occours
     * or is fired from Malta
     */
    this.lastEditedFile = false;

    /**
     * this is the container for all files involved
     * items are as following
     * path-of-file : {content: the-content-of-file, time: last-edit-time}
     */
    this.files = {};

    /**
     * that array is filled when diggin the base template looking
     * for file placeholders, and emptied at the end of digging
     * used to show the list of found file placeholders when Malta
     * suppose a circular inclusion
     */
    this.queue = [];

    /**
     * for sure the template
     */
    this.involvedFiles = 1;
    /**
     * every second the watch function loops over files literal
     * triggering the build as far as t least one file is updated
     * (checking the distance from stored file time and current file time)
     * when the build is fired, watch pauses inner execution, until
     * the build ends, the build function at the end will set that
     * value back to true, allowing watch to execute again time checks
     * on files
     */
    this.doBuild = true;

    /**
     * plugins container
     */
    this.plugins = {};

    /**
     * just a flag to know if plugins are required
     */
    this.hasPlugins = false;

    /**
     * time spend to build
     */
    this.t2b = 0;

    /**
     * should print the version on console?
     */
    this.printVersion = false;

    /**
     * maybe the user has passed a watch function at the start function
     * in this case it is stored here
     */
    this.userWatch = false;

    this.proc = false;

    this.name = Malta.name;

    /**
     * the watching obj returned by setInterval
     */
    this.watch_TI = false;

    /**
     * fs.watch handles for tracked files
     */
    this.watchers = {};

    /**
     * by default demon is active
     */
    this.demon = true;

    this.endCb = null;

    /**
     * t
     */
    this.t_start = 0;
    this.t_end = 0;

    /**
     * by default notify build with osascript
     */
    this.notifyBuild = true;

    /**
     * by default justCopy is disabled, if true prevents from all placeholders processing
     */
    this.justCopy = false;

    /**
     * plugin manager
     */
    this.pluginManager = new PluginManager(this);

    /**
     * attach the Sticky to che instance so any plugin can use it, e.g. test notifications
     */
    this.sticky = Sticky;

    /**
     * options passed
     */
    this.options = {};

    /**
     * by default show the inclusion path on the files where Malta knows how to comment
     */
    this.showPath = true;

    /**
     * default values for all options that can be passed throug the -options parameter
     */
    this.watchInterval = 1E3;

    /**
     * by default still the placeholders remain $$file$$ $var$ !{expression}!
     * but passing the maltaPlaceholder=true
     * one choose to opt instead for
     * maltaF('my/path/file', { 'options': 'here'})
     * maltaV('path/to/var/in/vars/js')
     * maltaE(the Expression)
     */
    this.placeholderMode = 'dolla';
}

/**
 * package name as specified in the package.json
 * @static
 * @type {String}
 */
Malta.name = 'name' in packageInfo ? packageInfo.name : 'Malta';

/**
 * current version as specified in the package.json
 * @static
 * @type {String}
 */
Malta.version = 'version' in packageInfo ? packageInfo.version : 'x.y.z';

/**
 * the author as specified in the package.json
 * @static
 * @type {String}
 */
Malta.author = 'author' in packageInfo ? packageInfo.author : 'Federio C. Ghedina ';

/**
 * 0 nothing, 1 some, 2 a lot
 */
Malta.verbose = 1;

/**
 * { item_description }
 */
Malta.printfile = '.printVersion';

Malta.executeCheck = 0;

Malta.running = true;

Malta.NL = NL;

Malta.TAB = TAB;
/**
 * @static
 */
Malta.execute = (tmpExe, cb) => {
    const exe = tmpExe, // .join(' '),
        exec = childProcess.exec,
        command = exec(exe.join(' '));

    command.stdout.on('data', function (data) {
        Malta.log_debug(`${data}`);
    });
    command.on('close', function (code) {
        Malta.executeCheck += ~~code;
        if (code) {
            Malta.log_err(`> \`${exe}\` child process closed with code ${code}`);
            cb && cb(new Error(`Child process exited with code ${code}`));
            return;
        }
        cb && cb(null);
    });
    command.on('error', function (err) {
        Malta.log_debug(`> \`${exe}\` child process error: ${err.message}`);
        cb && cb(err);
    });
};

/**
 * [badargs description]
 * @param  {[type]} tpl [description]
 * @param  {[type]} dst [description]
 * @return {[type]}     [description]
 */
Malta.badargs = (tpl, dst) => {
    const msg = [
        'ERR : It looks like',
        NL,
        (tpl ? tpl + NL : ''),
        (dst ? dst + NL : ''),
        'can`t be found!',
        NL,
        '... check, fix and rerun',
        NL
    ].join('');
    Malta.stop(colors.red(msg));
};

/**
 * [log_help description]
 * @return {[type]} [description]
 */
Malta.log_help = () => {
    Malta.outVersion(true);
    Malta.log_debug([
        'Usage:',
        '> malta [templatefile] [outdir] {options}',
        '> malta [buildfile.json]'
    ].join(NL));
    Malta.stop();
};

/**
 * { function_description }
 * @static
 */
Malta.outVersion = doNotWrite => {
    if (Malta.verbose === 0 || fs.existsSync(Malta.printfile)) return;
    const str = `${colors.rainbow(Malta.name)} v.${Malta.version}`,
        l = `${Malta.name} v.${Malta.version}`.length + 4,
        line = (new Array(l - 1)).join('═'),
        top = [
            NL,
            '╔', line, '╗', NL,
            '║ ', str, ' ║', NL,
            '╚', line, '╝', NL
        ].join('');
    if (!doNotWrite) fs.writeFileSync(Malta.printfile, '');
    console.log(top);
};

/**
 * Checks npm package dependencies, meant to be used at te very beginning of a plugin code
 *
 * @static
 * @memberof   Malta
 * @param      {mixed} one or more strings valued with the names of the dependenct package that must be checked
 * @return     {Object} the running instance of Malta
 */
Malta.checkDeps = (...deps) => {
    let i, l;
    const errs = [];

    for (i = 0, l = deps.length; i < l; i++) {
        try {
            require.resolve(deps[i]);
        } catch (e) {
            errs.push({
                err: e,
                msg: [
                    NL, colors.underline(deps[i]), ' package is needed',
                    NL, 'by a plugin ',
                    NL, colors.italic('but cannot be found'),
                    NL, colors.yellow(`run \`npm install ${deps[i]}\``)
                ].join('')
            });
        }
    }
    for (i = 0, l = errs.length; i < l; i++) {
        Malta.log_debug(`${colors.red(errs[i].err.code)}: ${errs[i].msg}`);
    }
    if (errs.length) {
        Malta.stop(() => {
            throw new Error('Error in dependencies check');
        });
    }
};

/**
 * Checks command line executables dependencies, meant to be used at te very beginning of a plugin code
 *
 * @static
 * @memberof Malta
 * @param      {string}  ex     the name of the executable to be checked
 * @return     {Object}  the running instance of Malta
 */
Malta.checkExec = (ex, fn) => childProcess.exec(`which ${ex}`, error => fn && fn(error));

/**
 * Factory method for Malta
 *
 * static
 * memberof   Malta
 * return     {Object}  a new Malta instance
 */
Malta.get = () => new Malta();

/**
 * Determines if command.
 *
 * @param      {string}  s       { parameter_description }
 * @return     {string}  True if command, False otherwise.
 */
Malta.isCommand = s => s.match(/^EXE/);

/**
 * { function_description }
 */
Malta.stop = what => {
    if (typeof what === 'function') {
        what();
    }
    if (!Malta.running) return;
    if (Malta.verbose > 0) {
        console.log(`${Malta.name} has stopped ${NL}`);
        what && console.log(`msg: ${what}`);
    }
    fs.unlink(Malta.printfile, () => { });
    Malta.running = false;
    if (Malta.instances) {
        Malta.instances.forEach(inst => {
            if (inst && typeof inst.shut === 'function') {
                inst.shut();
            }
        });
        Malta.instances = [];
    }
};

Malta.getRunsFromPath = p => {
    let ret = false,
        i;
    const demonRet = {},
        demon = p.match(/#/);
    if (demon) {
        p = p.replace('#', '');
    }

    if (fs.existsSync(p)) {
        ret = fs.readFileSync(p, { encoding: 'UTF8' });
        ret = utils.cleanJson(ret);
        try {
            ret = JSON.parse(ret);
        } catch (err) {
            Malta.log_info('Looks like a json configuration file is incorrect');
            Malta.log_err(err);
            Malta.stop();
        }
    }
    if (demon) {
        for (i in ret) {
            if (!Object.prototype.hasOwnProperty.call(ret, i)) continue;
            if (i.match(/^(#|EXE)/)) {
                demonRet[i] = ret[i];
            } else {
                demonRet[`#${i}`] = ret[i];
            }
        }
        return demonRet;
    }
    return ret;
};

Malta.replaceLinenumbers = tpl =>
    tpl.split(/\n/).map((line, i) =>
        line.replace(/__LINE__/g, i + 1)
    ).join(NL);

// PROTO

/**
 * [date description]
 * @param  {[type]} ) {return      new Date( [description]
 * @return {[type]}   [description]
 */
Malta.prototype.date = () => new Date();

/**
 * { function_description }
 *
 * @param      {<type>}  err         The error
 * @param      {<type>}  obj         The object
 * @param      {string}  pluginName  The plugin name
 */
// eslint-disable-next-line handle-callback-err
Malta.prototype.doErr = (err, obj, pluginName) => {
    Malta.log_debug(colors.red(`[ERROR on ${obj.name} using ${pluginName}] :`));
};

/**
 * [log_debug description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_debug = Malta.prototype.log_debug = function (msg) {
    if (Malta.verbose < 2) {
        return;
    }
    msg = (this.proc ? `${this.proc} ` : '') + msg;
    console.log(msg);
    return msg;
};

/**
 * [log_dir description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_dir = Malta.prototype.log_dir = function (msg) {
    if (Malta.verbose < 2) {
        return;
    }
    msg = (this.proc ? `${this.proc} ` : '') + JSON.stringify(msg);
    console.log(msg);
    return msg;
};

/**
 * [log_info description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_info = Malta.prototype.log_info = function (msg) {
    if (Malta.verbose === 0) {
        return;
    }
    msg = (this.proc ? `${this.proc} ` : '') + msg;
    console.log(msg);
    return msg;
};

/**
 * [log_warn description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_warn = Malta.prototype.log_warn = function (msg) {
    if (Malta.verbose === 0) {
        return;
    }
    msg = (this.proc ? `${this.proc} ` : '') + msg;
    console.log(msg);
    return msg;
};

/**
 * [log_err description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_err = Malta.prototype.log_err = function (err, msg) {
    if (Malta.verbose === 0) {
        return;
    }
    console.log(colors.red('ERROR'));
    msg && console.log(msg);
    console.log(err);
    return msg;
};
/**
 * [log description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log = Malta.prototype.log = function (msg) {
    if (Malta.verbose > 0) {
        msg = (this.proc ? `${this.proc} ` : '') + colors.yellow('[LOG]: ') + colors.white(msg);
        process.env.NODE_ENV !== 'test' && Malta.log_debug(msg);
        return msg;
    }
};

/**
 * basic string used to create regular expressions for
 * finding file, variable and executable placeholder
 *
 * @type {Object}
 */
Malta.prototype.reg = {
    dolla: {
        files: '(.*)\\$\\$([@A-z0-9-_/.]+)({([^}]*)})?\\$\\$',
        vars: '\\$([A-z0-9-_/.\\[\\]]+)\\$',
        calc: '!{([^{}]*)}!',
        innerVars: (n) => new RegExp([
            '\\$',
            n, '(\\|([^$]*))?',
            '\\$'
        ].join(''), 'g'),
        innerVarsBackup: () => new RegExp(/\$\w*(\|([^$]*))?\$/g)
    },
    func: {
        // the regexp is
        // /(.*)maltaF\('(.*)\'(?:\,(?:\s*)?(.*))?\)/
        files: '(.*)maltaF\\(\'(.*)\\\'(?:\\,(?:\\s*)?({(.*)}))?\\)',

        // the regExp is
        // /maltaV\('([A-z0-9-_/.\[\]]+)'\)/
        // either
        vars: 'maltaV\\(\'([A-z0-9-_/.\\[\\]]*)\'\\)',

        // nope fails the maltaE
        // vars: 'maltaV\\(\'(.*)\'\\)',

        // the RegExp is
        // /maltaE\(([^{}]*)\)/
        calc: 'maltaE\\(([^)]*)\\)',


        // the RegExp is (similar to the var one)
        //
        innerVars: (n) => new RegExp(`maltaV\\(['"]${n}['"](?:,([^)])*)?\\)`, 'g'),
        innerVarsBackup: () => new RegExp(/maltaV\(['"][^,)']*['"](,(?:\s*)?([^)]*))?\)/g)
    }
};


/**
 * [comments description]
 * @type {Object}
 */
Malta.prototype.comments = objMultiKey({
    'html|xml|svg': getCommentFn(`<!--${NL}`, `${NL}-->${NL}`),
    'pug|c|cpp|js|jsx|css|less|scss|php|java|ts': getCommentFn(`/*${NL}`, `${NL}*/${NL}`),
    rb: getCommentFn(`=begin${NL}`, `${NL}=end${NL}`),
    hs: getCommentFn(`{-${NL}`, `${NL}-}${NL}`)
});

/**
 * [build description]
 * @return {[type]} [description]
 */
Malta.prototype.build = function () {
    const self = this;
    let baseTplContent = this.files[this.tplPath].content;

    this.t_start = this.date();

    this.data = {
        content: null,
        name: null
    };

    // for sure the tpl is involved
    this.involvedFiles = 1;
    this.signBuildNumber();
    this.involvedFiles += this.hasVars();

    if (this.justCopy === false) {
        while (baseTplContent.match(new RegExp(this.reg[this.placeholderMode].files, 'g'))) {
            baseTplContent = this.replace_all(baseTplContent);
        }

        // wiredvars
        //
        baseTplContent = this.replace_vars(baseTplContent);
        baseTplContent = this.replace_wiredvars(baseTplContent);
        baseTplContent = this.replace_calc(baseTplContent);
        baseTplContent = this.microTpl(baseTplContent);
    }

    this.data.content = baseTplContent;
    this.data.name = this.outName;

    // do write
    //
    fs.writeFile(this.outName, this.data.content, err => {
        if (err) {
            Malta.log_debug(`Malta error writing file '${self.outName}' error: `);
            Malta.log_dir(err);
            return;
        }

        const d = self.date(),
            data = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`,
            msg = `@ ${data} ${Malta.name} compiled ${self.outName} (${self.getSize(self.outName)})`;

        self.t_end = self.date();

        self.notifyAndUnlock(self.t_start, msg);
        self.userWatch && self.userWatch.call(self, self.data, self);

        // plugins
        self.pluginManager.run();
    });

    return this;
};

Malta.prototype.then = function (cb) {
    this.endCb = cb;
};

/**
 * [checkInvolved description]
 * @return {[type]} [description]
 */
Malta.prototype.checkInvolved = function () {
    const l = this.queue.length;

    // look for circular inclusion
    if (l > 10 * utils.uniquearr(this.queue).length) {
        this.log_info(colors.red(`OOOOUCH: it seems like running a circular file inclusion'${NL}${TAB}try to look at the following inclusion queue to spot it quickly:${NL}this.queue`));
    }

    // look for too many files limit
    this.involvedFiles > this.MAX_INVOLVED && this.log_err(colors.white(`OUCH: it seems like trying to involve too many files: ${l}`));
};

/**
 * [check description]
 * @param  {[type]} a [description]
 * @return {[type]}   [description]
 */
Malta.prototype.check = function (a) {
    let tmp;
    const badArgs = [];

    // stop with usage info in case not enough args are given
    //
    if (a.length < 2) Malta.log_help();

    // demon ?
    tmp = a[0].match(/#(.*)/);
    if (tmp) {
        this.demon = false;
        a[0] = tmp[1];
    }

    // template and outdir params
    //
    // eslint-disable-next-line one-var
    const argTemplate = a[0],
        argOutDir = a[1];

    // check tpl and destination
    // if called badargs will stop malta
    //
    this.tplPath = path.resolve(execPath, argTemplate);
    this.outDir = path.resolve(execPath, argOutDir);

    !(fs.existsSync(this.tplPath)) && badArgs.push(this.tplPath);
    !(fs.existsSync(this.outDir)) && badArgs.push(this.outDir);

    badArgs.length && Malta.badargs.apply(null, badArgs);

    this.tplName = path.basename(this.tplPath);
    // this.tplName = path.basename(argTemplate);

    this.baseDir = path.dirname(this.tplPath);
    this.tplCnt = fs.readFileSync(this.tplPath).toString();
    this.execDir = execPath;

    this.baseDir === this.outDir
    && this.log_err(colors.red('Output and template directories coincide. Malta won`t overwrite your template'));

    this.inName = this.baseDir + DS + this.tplName;
    this.outName = this.outDir + DS + this.tplName;

    tmp = a.join(' ').match(/proc=(\d*)/);

    this.procNum = tmp ? tmp[1] : 0;
    this.proc = [`[#${this.procNum}] `, colors.white(this.tplName)].join('');

    this.args = a.splice(2);

    return this
        .loadOptions()
        .loadPlugins()
        .loadExecPackageInfo()
        .loadVars();
};

/**
 * Gets the size.
 *
 * @param      {<type>}   path    The path
 * @return     {boolean}  The size.
 */
Malta.prototype.getSize = aPath => {
    let byted = 0,
        kbyted = 0;
    try {
        byted = fs.statSync(aPath).size;
        kbyted = byted / 1024;
    } catch (e) {
        // ssssssshut the fuck up!
    }
    return kbyted < 1 ? `${byted.toFixed(2)} B` : `${kbyted.toFixed(2)} KB`;
};

/**
 * [hasVars description]
 * @return {Boolean} [description]
 */
Malta.prototype.hasVars = function () {
    return JSON.stringify(this.vars) !== '{}';
};

/**
 * [loadOptions description]
 * @return {[type]} [description]
 */
// eslint-disable-next-line complexity
Malta.prototype.loadOptions = function () {
    const self = this,
        allargs = self.args.join(' '),
        tmp = allargs.match(/-options=([^\s$]*)/);

    if (tmp && tmp.length && tmp[1]) {
        self.options = utils.jsonFromStr(tmp[1]);
        if ('verbose' in self.options) Malta.verbose = parseInt(self.options.verbose, 10);
        if ('watchInterval' in self.options) self.watchInterval = parseInt(self.options.watchInterval, 10);
        if ('showPath' in self.options) self.showPath = !!(self.options.showPath);
        if ('notifyBuild' in self.options) self.notifyBuild = !!(self.options.notifyBuild);
        if ('justCopy' in self.options) self.justCopy = !!(self.options.justCopy);
        if ('placeholderMode' in self.options && self.options.placeholderMode in self.reg) {
            self.placeholderMode = self.options.placeholderMode;
        }
    }

    if (tmp) {
        self.log_debug(colors.yellow('Loading options'));
        self.log_debug(JSON.stringify(self.options));
    }
    return this;
};

/**
 * [loadPlugins description]
 * @return {[type]} [description]
 */
Malta.prototype.loadPlugins = function () {
    const self = this,
        allargs = self.args.join(' '),
        reqs = allargs.match(/-(plugins|require)=([^\s$]*)/),
        p = reqs ? reqs[2].split('...') : [],
        l = p.length;

    let i = 0,
        parts;


    self.log_debug(colors.yellow('Loading plugins'));


    for (null; i < l; i++) {
        (function (j) {
            parts = p[j].match(/([^[]*)(\[(.*)\])?/);
            self.pluginManager.add(parts[1], utils.jsonFromStr(parts[3]) || false);
            self.hasPlugins = true;
        })(i);
    }

    if (self.hasPlugins) {
        self.log_dir(self.pluginManager.plugins);
    } else {
        self.log_debug(colors.white('... no plugins needed'));
    }
    return this;
};

/**
 * [listen description]
 * @param  {[type]} fpath [description]
 * @return {void}       [description]
 */
Malta.prototype.listen = function (fpath) {
    // listen to changes
    if (!(fpath in this.files)) {
        this.files[fpath] = utils.createEntry(fpath);
    }
};

Malta.prototype.loadExecPackageInfo = function () {
    this.execPackageVars = execPackageInfo;
    return this;
};

/**
 * [loadVars description]
 * @return {[type]} [description]
 */
Malta.prototype.loadVars = function () {
    const self = this,
        allargs = self.args.join(' ');
    let tmp;

    // by default search for vars.json in the same folder
    // of the tpl but if differently specified by a[2]
    // Hint: even if it expected to be in that position
    // it must be prefixed by -vars=json_relative_to_exec_folder
    //
    self.varPath = path.join(self.baseDir, '/vars.json');

    tmp = allargs.match(/-vars=([^\s$]*)/);
    if (tmp) {
        self.varPath = path.join(execPath, tmp[1]);
    }

    // get the content
    //
    if (fs.existsSync(self.varPath)) {
        try {
            tmp = utils.cleanJson(fs.readFileSync(self.varPath, { encoding: 'UTF8' }));
            if (utils.validateJson(tmp)) {
                tmp = JSON.parse(tmp);
                try {
                    self.vars = utils.solveJson(tmp);
                } catch (e) {
                    e.stop && Malta.log_err(`Variable looping placeholders: ${e.message}`);
                }
                self.log_debug(colors.yellow('Loaded vars file ') + NL + self.varPath);
            } else {
                Malta.log_debug(colors.red(`${self.varPath} not valid`));
                self.vars = {};
            }
        } catch (e) {
            self.vars = {};
        }
    } else {
        self.log_debug(colors.yellow(`No vars file to load${NL}`));
        self.varPath = false;
    }
    return this;
};

/**
 * Notifies and unlock.
 *
 * @param      {number}  start   The start
 * @param      {string}  msg     The message
 */
Malta.prototype.notifyAndUnlock = function (start, msg) {
    const self = this,
        end = self.date();

    msg = [
        msg ? (msg + NL) : '',
        'build #',
        this.buildnumber,
        ' in ',
        colors.white(`${end - start}`),
        'ms', NL,
        'watching ',
        colors.white(`${self.involvedFiles}`),
        ' files', NL
    ].join('');

    self.log_info(msg);
    self.doBuild = false;
};

/**
 * { function_description }
 */
Malta.prototype.delete_result = function () {
    Malta.log_debug(this.outName);
};

/**
 * [parse description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
Malta.prototype.parse = function (path) {
    const self = this;

    // update cached content and time for that file,
    // that at first cycle will be always the tpl, but
    // then will be any modified file
    //
    this.files[path] = utils.createEntry(path);

    // get updated content
    //
    // eslint-disable-next-line one-var
    const cnt = this.files[path].content;
    this.lastEditedFile = path;

    // start recursive dig
    //
    (function dig (c) {
        // look for files placeholders
        //
        const els = c.match(new RegExp(self.reg[self.placeholderMode].files, 'gm'));

        if (els) {
            // loop over all found
            //
            for (let i = 0, l = els.length; i < l; i++) {
                const p = els[i].match(new RegExp(self.reg[self.placeholderMode].files)),
                    f = p[2],
                    fname = f.match(/^\//)
                        ? execPath + f
                        : self.baseDir + DS + f;
                let tmp;

                if (f) {
                    if (self.queue[self.queue.length - 1] !== fname) self.queue.push(fname);

                    // check for circular inclusion
                    //
                    self.checkInvolved();

                    // if the entry is created, store it
                    //
                    tmp = utils.createEntry(fname);
                    if (tmp) {
                        self.files[fname] = tmp;

                        // and recur to look for inner inclusions
                        //
                        dig(`${self.files[fname].content}`);
                    }
                }
            }
        }
    })(`${cnt}`);

    // chain
    //
    return this;
};


Malta.prototype.microTpl = Malta.microTpl = cnt => {
    const rx = {
            outer: /(<malta%.*%malta>)/gm,
            inner: /<malta%(.*)%malta>/
        },
        m = `${cnt}`.split(rx.outer),
        ev = ['var r = [];'];

    if (m.length > 1) {
        m.forEach(el => {
            const t = el.match(rx.inner);
            if (t) {
                ev.push(t[1]);
            } else {
                ev.push('r.push(' + JSON.stringify(el) + ');');
            }
        });
        try {
            const ctx = vm.createContext({ r: [] });
            vm.runInNewContext(ev.join(NL), ctx, { timeout: 1000 });
            return ctx.r.join(NL);
        } catch (e) {
            Malta.log_debug(colors.red('Malta microtemplating error evaluating code: '));
            Malta.log_debug(ev.join(NL));
            return cnt;
        }
    }
    return cnt;
};

/**
 * [replace_all description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_all = function (tpl) {
    const self = this;

    return tpl.replace(new RegExp(self.reg[self.placeholderMode].files, 'g'), (str, $1, $2, $3, $4) => {
        let tmp,
            n,
            innerVars;
        const ext = utils.getFileExtension($2),
            fname = $2.match(/^\//)
                ? execPath + $2
                : self.baseDir + DS + $2;

        // file not found
        //
        if (!fs.existsSync(fname)) {
            // warn the user through console
            //
            self.log_info([
                colors.red('[WARNING]'),
                'missing file',
                fname
            ].join(' '));

            // file missing, replace a special placeholder
            // if ext is compatible
            //
            if (ext in self.comments) {
                return self.comments[ext](` ### ${$2} ### `);
            }

            // remove it
            return '';
        }

        // file exists, and we got indentation (spaces &| tabs)
        //
        tmp = self.files[fname].content.toString();

        if ($4) {
            innerVars = utils.jsonFromStr($4);
            /*
            // this is the simple one with no fallback value
            for (n in innerVars) {
                while (tmp.match(new RegExp('\\\$' + n + '\\\$'))) {
                    tmp = tmp.replace(new RegExp('\\\$' + n + '\\\$'), innerVars[n]);
                }
            }
            */

            // first for each innervar name xxx search for $xxx$ or $xxx|val$
            // and replace with the value of xxx
            //
            for (n in innerVars) {
                if (!Object.prototype.hasOwnProperty.call(innerVars, n)) continue;
                tmp = tmp.replace(
                    self.reg[self.placeholderMode].innerVars(n),
                    () => innerVars[n]
                );
            }
        }

        // can happen that for placeholder $yyy$ does not exists innerVars.yyy
        // in this case either the placeholder has a default value
        // that can be specified like $yyy|defaultValue$
        // either leave it so that if it is a normal variable (from vars.json)
        // will be processes and replaced afterward
        //
        tmp = tmp.replace(
            // eslint-disable-next-line no-useless-escape
            // new RegExp(/\$\w*(\|([^\$]*))?\$/g),
            self.reg[self.placeholderMode].innerVarsBackup(),
            function (str, $1, $2) { return $2 || str; }
        );

        // maybe add path tip in build just before file inclusion
        //
        if (self.showPath && ext in self.comments) {
            tmp = self.comments[ext](`[${Malta.name}] ${$2}`) + tmp;
        }

        // add a unit to the involved files count
        //
        self.involvedFiles += 1;

        // give back indentation, but for xml (just to mantain preformatted content)
        //
        return ext !== 'xml'
            ? $1 + tmp.replace(/\n/g, NL + $1)
            : tmp;
    });
};

/**
 * [replace_calc description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_calc = function (tpl) {
    const self = this;
    return tpl.replace(new RegExp(self.reg[self.placeholderMode].calc, 'g'), (str, $1) => $1);
};

/**
 * [replace_vars description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_vars = function (tpl) {
    const self = this,
        rep = val => {
            switch (self.placeholderMode) {
                case 'dolla':
                    return `$${val}$`;
                case 'func':
                    return `maltaV('${val}')`;
                default: return val;
            }
        };

    return tpl.replace(new RegExp(self.reg[self.placeholderMode].vars, 'g'), (str, $1) => {
        let isPackageVar = false,
            t;
        if (/^PACKAGE\./.test($1)) {
            isPackageVar = true;
            $1 = $1.replace('PACKAGE.', '');
        }
        t = utils.checkns(`${$1}`, self.vars);

        if (typeof t === 'object') {
            t = JSON.stringify(t);
            if (typeof t !== UNDEFINED) {
                return t;
            }
        }
        if (isPackageVar) {
            t = utils.checkns(`${$1}`, self.execPackageVars);
        }
        return typeof t !== UNDEFINED ? t : rep($1);
    });
};

/**
 * [replace_wiredvars description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_wiredvars = function (tpl) {
    const self = this;
    tpl = self.replace_vars(tpl);
    if (tpl.match(/__LINE__/)) {
        tpl = Malta.replaceLinenumbers(tpl);
    }
    return utils.replaceAll(tpl, {
        TIME: `${self.date().getHours()}:${self.date().getMinutes()}:${self.date().getSeconds()}`,
        DATE: `${self.date().getDate()}/${self.date().getMonth() + 1}/${self.date().getFullYear()}`,
        YEAR: self.date().getFullYear(),
        FILES: self.involvedFiles,
        NAME: Malta.name,
        VERSION: Malta.version,
        BUILDNUMBER: self.buildnumber,
        BUILDNUM: self.buildnumber,
        FILE: self.tplName
    }, {
        delim: ['__', '__']
    });
};

/**
 * Must be called after check, to start Malta demon
 * @param  {function} userWatch this function if specified will be callled at every build
 * @return {void}
 */
Malta.prototype.start = function (userWatch) {
    const self = this;
    if (self.varPath) {
        self.files[self.varPath] = utils.createEntry(self.varPath);
    }
    if (userWatch) {
        self.userWatch = userWatch;
    }
    self.parse(self.tplPath);
    if (self.demon) {
        self.watch();
    }
    self.build();
    return this;
};

/**
 * [signBuildNumber description]
 * @return {[type]} [description]
 */
Malta.prototype.signBuildNumber = function () {
    const fname = path.join(this.baseDir, '.buildNum.json');
    let cnt;
    if (!fs.existsSync(fname)) {
        cnt = '{}';
        fs.writeFileSync(fname, cnt);
    }
    try {
        cnt = JSON.parse(fs.readFileSync(fname));
        if (!(this.inName in cnt)) cnt[this.inName] = 0;
        cnt[this.inName] = (parseInt(cnt[this.inName], 10) || 0) + 1;
        this.buildnumber = cnt[this.inName];
        fs.writeFileSync(fname, JSON.stringify(cnt));
    } catch (e) {
        fs.writeFileSync(fname, '{}');
    }
};

/**
 * [stop description]
 * @return {[type]} [description]
 */
Malta.prototype.stop = Malta.stop;

/**
 * [utils description]
 * @type {Object}
 */
Malta.prototype.utils = utils;

/**
 * [watch description]
 * @return {[type]} [description]
 */
Malta.prototype.setupWatchers = function () {
    const self = this;
    self.closeWatchers();
    for (const f in self.files) {
        if (!Object.prototype.hasOwnProperty.call(self.files, f)) continue;
        if (!fs.existsSync(f)) continue;
        try {
            self.watchers[f] = fs.watch(f, function (eventType) {
                if (eventType !== 'change') return;
                if (self.doBuild) return;
                self.handleFileChange(f);
            });
        } catch (e) {
            self.log_debug(`Could not watch ${f}: ${e.message}`);
        }
    }
};

Malta.prototype.closeWatchers = function () {
    const self = this;
    for (const f in self.watchers) {
        if (!Object.prototype.hasOwnProperty.call(self.watchers, f)) continue;
        try {
            self.watchers[f].close();
        } catch (e) {}
    }
    self.watchers = {};
};

Malta.prototype.handleFileChange = function (f) {
    const self = this;
    if (self.doBuild) return;
    self.queue = [];
    if (!fs.existsSync(f)) {
        self.closeWatchers();
        Malta.log_debug(colors.yellow('REMOVED ') + f + NL);
        return;
    }
    const d = self.date();
    self.log_info(`[${colors.yellow('MODIFIED')} @ ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] ${colors.underline(f.replace(self.baseDir + DS, ''))}`);
    self.files[f] = utils.createEntry(f);
    self.doBuild = true;
    if (f === self.varPath) {
        const varsContent = utils.cleanJson(fs.readFileSync(self.varPath, { encoding: 'UTF8' }));
        if (utils.validateJson(varsContent)) {
            try {
                self.vars = utils.solveJson(JSON.parse(varsContent));
            } catch (e) {
                Malta.log_err(`Variable looping placeholders: ${e.message}`);
            }
        } else {
            Malta.log_debug(colors.red(`${self.varPath} not valid`));
        }
    }
    self.parse(f);
    self.build();
};

Malta.prototype.watch = function () {
    const self = this;
    self.log_debug(colors.yellow('Watching files using fs.watch') + NL);
    self.setupWatchers();
    // periodic refresh to catch newly discovered files or file replacements
    self.watch_TI = setInterval(function () {
        if (!self.doBuild) self.setupWatchers();
    }, 5E3);
    return this;
};

Malta.prototype.shut = function () {
    clearInterval(this.watch_TI);
    this.closeWatchers();
};

// be sure to call malta stop when the user CTRL+C
//
process.on('SIGINT', () => { Malta.stop('SIGINT'); });

module.exports = Malta;
