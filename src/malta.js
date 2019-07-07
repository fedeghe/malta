#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs'),
    path = require('path'),
    childProcess = require('child_process'),
    Mpromise = require('./maltapromise.js'),
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
    UNDEFINED = 'undefined';

// string proto for console colors
require('./stringproto');

/**
 * Malta is the main object that will watch for modifications and build when needed
 *
 * @constructor Malta
 * @class      Malta (name)
 * @return     {Object}  The instance of Malta
 */
function Malta () {
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
     * maltaFile('my/path/file', { 'options': 'here'})
     * maltaVar('path/to/var/in/vars/js')
     * maltaExpression(the Expression)
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
Malta.author = 'version' in packageInfo ? packageInfo.version : 'x.y.z';

/**
 * 0 nothing, 1 some, 2 a lot
 */
Malta.verbose = 1;

/**
 * allow simple promise to be used (eg malta-translate plugin)
 */
Malta.Promise = Mpromise;

/**
 * { item_description }
 */
Malta.printfile = '.printVersion';

Malta.executeCheck = 0;

Malta.running = true;

Malta.NL = NL;

Malta.TAB = TAB;

Malta.execute = function (tmpExe, then) {
    const exe = tmpExe, // .join(' '),
        // c = tmpExe[0];
        // opt = tmpExe.length > 1 ? tmpExe.slice(1).join(' ') : false,
        exec = childProcess.exec,
        command = exec(exe.join(' '));

    command.stdout.on('data', function (data) {
        console.log(`${data}`);
    });
    command.on('close', function (code) {
        Malta.executeCheck += ~~code;
        if (code) process.exit(1);
        if (typeof then !== UNDEFINED) then();
    });
    command.on('error', function (code, err) {
        Malta.executeCheck += ~~code;
        console.log(`> \`${exe}\` child process exited with code ${code}`);
        process.exit(1);
    });
};

/**
 * [badargs description]
 * @param  {[type]} tpl [description]
 * @param  {[type]} dst [description]
 * @return {[type]}     [description]
 */
Malta.badargs = function (tpl, dst) {
    const msg = [
        'ERR : It looks like',
        NL,
        (tpl ? tpl + NL : ''),
        (dst ? dst + NL : ''),
        'can`t be found!',
        NL,
        '... check, fix and rerun',
        NL
    ].join('').red();
    Malta.stop(msg);
};

/**
 * [log_help description]
 * @return {[type]} [description]
 */
Malta.log_help = function () {
    Malta.outVersion(true);
    console.log([
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
Malta.outVersion = function (doNotWrite) {
    if (Malta.verbose === 0 || fs.existsSync(Malta.printfile)) return;
    const str = `${Malta.name.rainbow()} v.${Malta.version}`,
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
Malta.checkDeps = function () {
    let i, l,
        errs = [];
    const deps = [].slice.call(arguments, 0);

    for (i = 0, l = deps.length; i < l; i++) {
        try {
            require.resolve(deps[i]);
        } catch (e) {
            errs.push({
                err: e,
                msg: [
                    NL, deps[i].underline(), ' package is needed',
                    NL, 'by a plugin ',
                    NL, 'but cannot be found'.italic(),
                    NL, `run \`npm install ${deps[i]}\``.yellow()
                ].join('')
            });
        }
    }
    for (i = 0, l = errs.length; i < l; i++) {
        console.log(`${errs[i].err.code.red()}: ${errs[i].msg}`);
    }
    if (errs.length) Malta.stop();
    return this;
};

/**
 * Checks command line executables dependencies, meant to be used at te very beginning of a plugin code
 *
 * @static
 * @memberof Malta
 * @param      {string}  ex     the name of the executable to be checked
 * @return     {Object}  the running instance of Malta
 */
Malta.checkExec = function (ex) {
    let err;

    childProcess.exec(`which ${ex}`, function (error) {
        if (error !== null) {
            err = {
                err: `${error}`,
                msg: [
                    NL, ex.underline(), ' executable is needed', NL,
                    'but cannot be found'.italic(), NL,
                    `install \`${ex}\` and try again`.yellow()
                ].join('')
            };
            console.log(`${err.err.red()} ${err.msg}`);
            Malta.stop();
        }
    });
    return this;
};

/**
 * Factory method for Malta
 *
 * static
 * memberof   Malta
 * return     {Object}  a new Malta instance
 */
Malta.get = function () {
    return new Malta();
};

/**
 * Determines if command.
 *
 * @param      {string}  s       { parameter_description }
 * @return     {string}  True if command, False otherwise.
 */
Malta.isCommand = function (s) {
    return s.match(/^EXE/);
};

/**
 * { function_description }
 */
Malta.stop = function (msg) {
    if (!Malta.running) return;
    if (Malta.verbose > 0) {
        console.log(`${Malta.name} has stopped ${NL}`);
        msg && console.log(`msg: ${msg}`);
    }
    fs.unlink(Malta.printfile, () => { });
    Malta.running = false;
    process.exit();
};

Malta.getRunsFromPath = function (p) {
    let ret = false,
        demonRet = {},
        i,
        demon = p.match(/#/);
    if (demon) {
        p = p.replace('#', '');
    }

    if (fs.existsSync(p)) {
        ret = fs.readFileSync(p, { encoding: 'UTF8' });
        ret = utils.cleanJson(ret);
        ret = JSON.parse(ret);
    }
    if (demon) {
        for (i in ret) {
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

Malta.replaceLinenumbers = function (tpl) {
    return tpl.split(/\n/).map(function (line, i) {
        return line.replace(/__LINE__/g, i + 1);
    }).join(NL);
};

// PROTO

/**
 * [date description]
 * @param  {[type]} ) {return      new Date( [description]
 * @return {[type]}   [description]
 */
Malta.prototype.date = function () {
    return new Date();
};

/**
 * { function_description }
 *
 * @param      {<type>}  err         The error
 * @param      {<type>}  obj         The object
 * @param      {string}  pluginName  The plugin name
 */
Malta.prototype.doErr = function (err, obj, pluginName) {
    console.log(`[ERROR on ${obj.name} using ${pluginName}] :`.red());
    console.dir(err);
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
};

/**
 * [log_err description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log_err = Malta.prototype.log_err = function (msg) {
    if (Malta.verbose > 0) {
        msg = (this.proc ? `${this.proc} ` : '') + '[ERROR]: '.red() + msg.red();
        console.log(msg);
    }
    Malta.stop('log_err');
};
/**
 * [log description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.log = Malta.prototype.log = function (msg) {
    if (Malta.verbose > 0) {
        msg = (this.proc ? `${this.proc} ` : '') + '[LOG]: '.yellow() + msg.white();
        // console.dir(process.env)
        process.env.NODE_ENV !== 'test' && console.log(msg);
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
        // /(.*)maltaFile\('(.*)\'(?:\,(?:\s*)?(.*))?\)/
        files: '(.*)maltaFile\\(\'(.*)\\\'(?:\\,(?:\\s*)?({(.*)}))?\\)',

        // the regExp is
        // /maltaVar\('([A-z0-9-_/.\[\]]+)'\)/
        vars: 'maltaVar\\(\'([A-z0-9-_/.\\[\\]]*)\'\\)',

        // the RegExp is
        // /maltaExpression\(([^{}]*)\)/
        calc: 'maltaExpression\\((.*)\\)',


        // the RegExp is (similar to the var one)
        //
        innerVars: (n) => new RegExp(`maltaVar\\('${n}',([^)]*)?\\)`, 'g'),
        innerVarsBackup: () => new RegExp(/maltaVar\('[^,]*'(,(?:\s*)?([^)]*))?\)/g)
    }
};

function getCommentFn (pre, post) {
    return function (cnt) {
        return pre + cnt + post;
    };
}

function objMultiKey (o) {
    let ret = {}, i, j, jl, ks;
    for (i in o) {
        if (o.hasOwnProperty(i)) {
            ks = i.split('|');
            for (j = 0, jl = ks.length; j < jl; j++) ret[ks[j]] = o[i];
        }
    }
    return ret;
}

/**
 * [comments description]
 * @type {Object}
 */
Malta.prototype.comments = objMultiKey({
    'html|xml|svg': getCommentFn(`<!--${NL}`, `${NL}-->${NL}`),
    'pug|c|cpp|js|jsx|css|less|scss|php|java|ts': getCommentFn(`/*${NL}`, `${NL}*/${NL}`),
    'rb': getCommentFn(`=begin${NL}`, `${NL}=end${NL}`),
    'hs': getCommentFn(`{-${NL}`, `${NL}-}${NL}`)
});

/**
 * [build description]
 * @return {[type]} [description]
 */
Malta.prototype.build = function () {
    const self = this;
    let baseTplContent = self.files[self.tplPath].content;

    self.t_start = self.date();

    self.data = {
        content: null,
        name: null
    };

    // for sure the tpl is involved
    self.involvedFiles = 1;
    self.signBuildNumber();
    self.involvedFiles += self.hasVars();

    if (self.justCopy === false) {
        while (baseTplContent.match(new RegExp(self.reg[self.placeholderMode].files, 'g'))) {
            baseTplContent = self.replace_all(baseTplContent);
        }

        // wiredvars
        //
        baseTplContent = self.replace_vars(baseTplContent);
        baseTplContent = self.replace_wiredvars(baseTplContent);
        baseTplContent = self.replace_calc(baseTplContent);
        baseTplContent = self.microTpl(baseTplContent);
    }

    self.data.content = baseTplContent;
    self.data.name = self.outName;

    // do write
    //
    fs.writeFile(self.outName, self.data.content, function (err) {
        if (err) {
            console.log(`Malta error writing file '${self.outName}' error: `);
            console.dir(err);
            Malta.stop();
        }

        const d = self.date(),
            data = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

        let msg = `@ ${data}
${Malta.name} compiled ${self.outName} (${self.getSize(self.outName)})`;

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
    // look for circular inclusion
    //
    if (this.queue.length > 10 * utils.uniquearr(this.queue).length) {
        this.log_info([
            'OOOOUCH: it seems like running a circular file inclusion',
            NL, TAB,
            'try to look at the following inclusion queue to spot it quickly:',
            NL, this.queue
        ].join('').red());
    }

    // look for too many files limit
    //
    if (this.involvedFiles > this.MAX_INVOLVED) {
        this.log_err([
            'OUCH: it seems like trying to involve too many files: ',
            this.queue.length
        ].join('').white());
    }
};

/**
 * [check description]
 * @param  {[type]} a [description]
 * @return {[type]}   [description]
 */
Malta.prototype.check = function (a) {
    let tmp,
        badArgs = [],
        argTemplate,
        argOutDir;

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
    argTemplate = a[0];
    argOutDir = a[1];

    // check tpl and destination
    // if called badargs will stop malta
    //
    this.tplPath = path.resolve(execPath, argTemplate);
    this.outDir = path.resolve(execPath, argOutDir);

    if (!(fs.existsSync(this.tplPath))) badArgs.push(this.tplPath);
    if (!(fs.existsSync(this.outDir))) badArgs.push(this.outDir);

    if (badArgs.length) Malta.badargs.apply(null, badArgs);

    this.tplName = path.basename(this.tplPath);
    // this.tplName = path.basename(argTemplate);

    this.baseDir = path.dirname(this.tplPath);
    this.tplCnt = fs.readFileSync(this.tplPath).toString();
    this.execDir = execPath;

    if (this.baseDir === this.outDir) {
        this.log_err('Output and template directories coincide. Malta won`t overwrite your template'.red());
    }

    this.inName = this.baseDir + DS + this.tplName;
    this.outName = this.outDir + DS + this.tplName;

    tmp = a.join(' ').match(/proc=(\d*)/);

    this.procNum = tmp ? tmp[1] : 0;
    this.proc = [`[#${this.procNum}] `, this.tplName.white()].join('');

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
Malta.prototype.getSize = function (path) {
    const byted = fs.statSync(path).size,
        kbyted = byted / 1024;
    return kbyted < 1 ? `${byted.toFixed(2)} B` : `${kbyted.toFixed(2)} KB`;
};

/**
 * [hasVars description]
 * @return {Boolean} [description]
 */
Malta.prototype.hasVars = function () {
    return this.vars !== {};
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
        self.log_debug('Loading options'.yellow());
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
        p = reqs ? reqs[2].split('...') : [];

    let i = 0, l = p.length,
        parts;

    self.log_debug('Loading plugins'.yellow());


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
        self.log_debug(('... no plugins needed').white());
    }
    return this;
};

/**
 * [listen description]
 * @param  {[type]} fpath [description]
 * @return {void}       [description]
 */
Malta.prototype.listen = function (fpath) {
    const self = this;
    // listen to changes
    if (!(fpath in self.files)) {
        self.files[fpath] = utils.createEntry(fpath);
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
                    e.stop && Malta.stop(e.message);
                }
                self.log_debug('Loaded vars file '.yellow() + NL + self.varPath);
            } else {
                console.log(`${self.varPath} not valid`.red());
                self.vars = {};
            }
        } catch (e) {
            self.vars = {};
        }
    } else {
        self.log_debug(`No vars file to load${NL}`.yellow());
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
        `${end - start}`.white(),
        'ms', NL,
        'watching ',
        `${self.involvedFiles}`.white(),
        ' files', NL
    ].join('');

    self.log_info(msg);
    self.doBuild = false;
};

/**
 * { function_description }
 */
Malta.prototype.delete_result = function () {
    const self = this;
    console.log(self.outName);
};

/**
 * [parse description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
Malta.prototype.parse = function (path) {
    const self = this;
    let cnt;

    // update cached content and time for that file,
    // that at first cycle will be always the tpl, but
    // then will be any modified file
    //
    self.files[path] = utils.createEntry(path);

    // get updated content
    //
    cnt = self.files[path].content;
    self.lastEditedFile = path;

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
                    f = p[2];
                let tmp,
                    fname = f.match(/^\//)
                        ? execPath + f
                        : self.baseDir + DS + f;

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


Malta.prototype.microTpl = function (cnt) {
    // "use strict" /// not here cause eval
    const rx = {
            outer: /(<malta%.*%malta>)/gm,
            inner: /<malta%(.*)%malta>/
        },
        m = `${cnt}`.split(rx.outer);

    let r,
        ev = ['r = [];'];
    // rout = [];

    if (m.length > 1) {
        m.forEach(function (el) {
            const t = el.match(rx.inner);
            if (t) {
                ev.push(t[1]);
            } else {
                // this is really dangerous
                //
                ev.push([
                    'r.push(`',
                    el.replace(/"/g, '\\"').replace(/'/g, '\\\''),
                    '`)'
                ].join(''));
            }
        });
        try {
            eval(ev.join(NL));
        } catch (e) {
            console.log('Malta microtemplating error evaluating code: '.red());
            console.log(ev.join(NL));
            Malta.stop(e.message);
        }


        /*
        // remove empty lines from r
        r = r.filter(function (v) {
            return v.length;
        });
        */
        return r.join(NL);
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

    return tpl.replace(new RegExp(self.reg[self.placeholderMode].files, 'g'), function (str, $1, $2, $3, $4) {
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
                '[WARNING]'.red(),
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
            console.log('innerVars: ', innerVars, $4);
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
                console.log('trying to replace ', n);
                /// DO NOT filter here with hasOwnProperty
                var tmpxxx = self.reg[self.placeholderMode].innerVars(n);
                console.log('not matching here');
                console.log(tmp);
                console.log(tmpxxx);
                tmp = tmp.replace(
                    tmpxxx,
                    function () { return innerVars[n]; }
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
    return tpl.replace(new RegExp(self.reg[self.placeholderMode].calc, 'g'), function (str, $1) {
        return eval($1);
    });
};

/**
 * [replace_vars description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_vars = function (tpl) {
    const self = this;
    return tpl.replace(new RegExp(self.reg[self.placeholderMode].vars, 'g'), function (str, $1) {
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
        return typeof t !== UNDEFINED ? t : `$${$1}$`;
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
Malta.prototype.watch = function () {
    const self = this;
    let d, f, varsContent;

    function watch () {
        // empty queue
        //
        self.queue = [];

        for (f in self.files) {
            // if the file has been removed
            //
            if (!fs.existsSync(f)) {
                self.shut();
                console.log('REMOVED '.yellow() + f + NL);

                // something changed ?
                //
            } else if (self.files[f].time < utils.getFileTime(f)) {
                d = self.date();

                self.log_info(`[${'MODIFIED'.yellow()} @ ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}] ${f.replace(self.baseDir + DS, '').underline()}`);
                // renew entry
                //
                self.files[f] = utils.createEntry(f);

                // active flag rebuild
                //
                self.doBuild = true;

                // if it`s vars .json reload it
                //
                if (f === self.varPath) {
                    // update vars
                    varsContent = utils.cleanJson(fs.readFileSync(self.varPath, { encoding: 'UTF8' }));
                    if (utils.validateJson(varsContent)) {
                        varsContent = JSON.parse(varsContent);
                        try {
                            self.vars = utils.solveJson(varsContent);
                        } catch (e) {
                            e.stop && Malta.stop(e.message);
                        }
                    } else {
                        console.log(`${self.varPath} not valid`.red());
                    }
                }

                self.parse(f);
            }
        }
        if (self.doBuild) self.build();
    }

    // every second, if nothing is building, watch files
    //
    self.log_debug('Watch interval used : '.yellow() + `${self.watchInterval}`.red());

    // save the interval fucntion so that if the element is removed (wildcard)
    // then the interval is cleared by the shut function
    //

    this.watch_TI = setInterval(function () {
        if (!self.doBuild) watch();
    }, this.watchInterval);

    // chain
    //
    return this;
};

Malta.prototype.shut = function () {
    clearInterval(this.watch_TI);
};

// be sure to call malta stop when the user CTRL+C
//
process.on('SIGINT', () => { Malta.stop('SIGINT'); });
process.on('exit', () => {
    // if programmatic
    if (!global.BIN_MODE) {
        Malta.verbose = 0;
    }
    Malta.stop();
});

module.exports = Malta;
