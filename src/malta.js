#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	child_process = require('child_process'),
	Promise = require('./maltapromise.js'),
	execPath = process.cwd(),
	packageInfo = fs.existsSync(__dirname + '/../package.json') ? require(__dirname + '/../package.json') : {},
	DS = path.sep,
	NL = "\n",
	TAB = "\t";

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
	'use strict';
	
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
 * default values for all options that can be passed throug the -options parameter
 */
Malta.watchInterval = 1E3;


/**
 * 0 nothing, 1 some, 2 a lot
 */
Malta.verbose = 1; 

/**
 * by default show the inclusion path on the files where Malta knows how to comment
 */
Malta.showPath = true;

/**
 * { item_description }
 */
Malta.printfile = '.printVersion';



Malta.execute = function (tmpExe, then) {
	//'use strict'; not here
	var exe = tmpExe, //.join(' '),
		c = tmpExe[0];
		opt = tmpExe.length > 1 ? tmpExe.slice(1).join(' ') : false,
		spawn = child_process.spawn,
		command = spawn(c, opt.length ? opt.split(' ') : null);

	command.stdout.on( 'data', function (data) {
	    console.log(`${data}`);
	});
	
	command.on( 'close', function (code) {
		console.log(`\`${exe}\` child process exited with code ${code}`);
		typeof then !== 'undefined' && then();
	});
};


/**
 * [badargs description]
 * @param  {[type]} tpl [description]
 * @param  {[type]} dst [description]
 * @return {[type]}     [description]
 */
Malta.badargs = function (tpl, dst) {
	'use strict';
	console.log(('ERR : It looks like' + NL +
		(tpl ? tpl + NL : "") + 
		(dst ? dst + NL : "") + 
		'can`t be found!' + NL + 
		'... check, fix and rerun' + NL ).red());
	Malta.stop();
};

/**
 * [log_help description]
 * @return {[type]} [description]
 */
Malta.log_help = function () {
	'use strict';
	Malta.outVersion(true);
	console.log('Usage:' + NL + '> malta [templatefile] [outdir] {options}' + NL + '> malta [buildfile.json]' + NL);
	Malta.stop();
};

/**
 * { function_description }
 * @static
 */
Malta.outVersion = function (do_not_write) {
	'use strict';
	if (Malta.verbose === 0 || fs.existsSync(Malta.printfile)) return;
	var str = Malta.name.rainbow() + ' v.' + Malta.version,
		l = (Malta.name + ' v.' + Malta.version).length + 4,
		top = NL +
			"╔" + (new Array(l-1)).join("═") + "╗" + NL +
			"║" +      ' ' + str + ' '       + "║" + NL + 
			"╚" + (new Array(l-1)).join("═") + "╝" + NL;
	!do_not_write && fs.writeFileSync(Malta.printfile, '');
	console.log(top);
}

/**
 * Checks npm package dependencies, meant to be used at te very beginning of a plugin code
 * 
 * @static
 * @memberof   Malta
 * @param      {mixed} one or more strings valued with the names of the dependenct package that must be checked
 * @return     {Object} the running instance of Malta
 */
Malta.checkDeps = function () {
	'use strict';
	var i,l,
		errs = [],
		deps = [].slice.call(arguments, 0);

	for (i = 0, l = deps.length; i < l; i++){
		try {
		    require.resolve(deps[i]);
		} catch(e) {
			errs.push({
				err : e,
				msg : NL + deps[i].underline() + " package is needed"+
		    		NL + "by a plugin "+
		    		NL + "but cannot be found".italic()+
		    		NL + ("run `npm install " + deps[i] + "`").yellow()
			});
		}
	}
	for (i=0, l = errs.length; i < l; i++) {
		console.log(errs[i].err.code.red() + ': ' + errs[i].msg);
	}
	errs.length && Malta.stop();
	return this;
}

/**
 * Checks command line executables dependencies, meant to be used at te very beginning of a plugin code
 * 
 * @static
 * @memberof Malta
 * @param      {string}  ex 	the name of the executable to be checked
 * @return     {Object}  the running instance of Malta
 */
Malta.checkExec = function (ex) {
	'use strict';
	var err;

	child_process.exec("which " + ex, function (error, stdout, stderr) {
		if (error !== null) {
			err = {
				err : error + '',
				msg : NL + ex.underline() + " executable is needed" + NL + 
					"but cannot be found".italic() + NL + 
					("install `" + ex  + "` and try again").yellow()
			};
			console.log(err.err.red() + ' ' + err.msg);
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
	return new Malta;
}

/**
 * Determines if command.
 *
 * @param      {string}  s       { parameter_description }
 * @return     {string}  True if command, False otherwise.
 */
Malta.isCommand = function(s) {
	return s.match(/^EXE/);
}

/**
 * { function_description }
 */
Malta.stop =  function() {
	'use strict';
	console.log(Malta.name + ' has stopped' + NL);
	fs.unlink(Malta.printfile);
	process.exit();
};

/**
 * [date description]
 * @param  {[type]} ) {return      new Date( [description]
 * @return {[type]}   [description]
 */
Malta.prototype.date = function() {return new Date(); };

/**
 * { function_description }
 *
 * @param      {<type>}  err         The error
 * @param      {<type>}  obj         The object
 * @param      {string}  pluginName  The plugin name
 */
Malta.prototype.doErr = function (err, obj, pluginName) {
	console.log(('[ERROR on ' + obj.name + ' using ' + pluginName + '] :').red());
	console.dir(err);
};

/**
 * [log_debug description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_debug = function (msg){
	'use strict';
	if (Malta.verbose < 2){
		return;
	}
	console.log(this.proc + " " + msg);
}; 

/**
 * [log_dir description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_dir = function (msg){
	'use strict';
	if (Malta.verbose < 2){
		return;
	}
	console.log(this.proc + " " + JSON.stringify(msg));
};

/**
 * [log_info description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_info = function (msg){
	'use strict';
	if (Malta.verbose === 0){
		return;
	}
	var self = this;
	console.log(this.proc + " " + msg);
};

/**
 * [log_warn description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_warn = function (msg) {
	'use strict';
	if (Malta.verbose === 0){
		return;
	}
	console.log(this.proc + " " + msg);
};

/**
 * [log_err description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_err = function (msg) {
	'use strict';
	if (Malta.verbose > 0){
		console.log(this.proc + " " + "[ERROR]: ".red() + msg.red());
	}
	Malta.stop();
};

/**
 * basic string used to create regular expressions for 
 * finding file, variable and executable placeholder
 * 
 * @type {Object}
 */
Malta.prototype.reg = {
	files: '(.*)\\\$\\\$([A-z0-9-_/.]+)({([^}]*)})?\\\$\\\$',
	vars: '\\\$([A-z0-9-_/.]+)\\\$',
	calc : '\!{([^{}]*)}\!'
};


function getCommentFn(pre, post) {
	return function(cnt) {return pre + cnt + post; };
}
/**
 * [comments description]
 * @type {Object}
 */
Malta.prototype.comments = {
	"html" : getCommentFn("<!--\n", "\n-->\n"),
	"xml" : getCommentFn("<!--\n", "\n-->\n"),
	"svg" : getCommentFn("<!--\n", "\n-->\n"),
	"pug" : getCommentFn("//\n//", "\n//\n"),
	"c" : getCommentFn("/*\n", "\n*/\n"),
	"cpp" : getCommentFn("/*\n", "\n*/\n"),
	"js" : getCommentFn("/*\n", "\n*/\n"),
	"css" : getCommentFn("/*\n", "\n*/\n"),
	"less" : getCommentFn("/*\n", "\n*/\n"),
	"scss" : getCommentFn("/*\n", "\n*/\n"),
	"php" : getCommentFn("/*\n", "\n*/\n"),
	"java" : getCommentFn("/*\n", "\n*/\n"),
	"ts" : getCommentFn("/*\n", "\n*/\n"),
	"rb" : getCommentFn("=begin\n", "\n=end\n"),
	"hs" : getCommentFn("{-\n", "\n-}\n")
};

/**
 * [build description]
 * @return {[type]} [description]
 */
Malta.prototype.build = function() {
	'use strict';

	var self = this,
		baseTplContent = self.files[self.tplPath].content,
		start = self.date(),
		end,
		ext;

	self.content_and_name = {
		content : null,
		name : null
	};

	// for sure the tpl is involved
	self.involvedFiles = 1;

	self.signBuildNumber();

	self.involvedFiles += self.hasVars();


	while (baseTplContent.match(new RegExp(self.reg.files, 'g')))
		baseTplContent = self.replace_all(baseTplContent);

	

	// wiredvars
	// 
	baseTplContent = self.replace_vars(baseTplContent);
	baseTplContent = self.replace_wiredvars(baseTplContent);
	baseTplContent = self.replace_calc(baseTplContent);
	

	// baseTplContent = self.microTpl(baseTplContent);


	self.content_and_name.content = baseTplContent;
	self.content_and_name.name = self.outName;

	// do write
	// 
	fs.writeFile(self.outName, self.content_and_name.content, function(err) {
		var d = self.date(),
			data = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(),
			msg = '';

		msg += '@ ' + data + NL;
		msg += Malta.name + ' compiled ' + self.outName + ' (' + self.getSize(self.outName) + ')';
		end = self.date();
		
		self.notifyAndUnlock(start, msg);

		self.userWatch && self.userWatch.call(self, self.content_and_name, self);

		doPlugin();
	});

	function doPlugin() {
		var pluginKeys = Object.keys(self.plugins);
		
		pluginKeys.length && self.log_info('Starting plugins'.yellow());

		if (self.hasPlugins) {
			self.log_debug('on ' + self.outName.underline() + ' called plugins:');
			plugin4ext(self.utils.getIterator(pluginKeys));
		}
	}
	 
	function plugin4ext(extIterator) {
		
		(function checknext(){
			if (extIterator.hasNext()) {
				var ext = extIterator.next(),
					pins  = self.plugins[ext],
					iterator;

				// if ends with the extension
				//    ----
				if (self.outName.match(new RegExp(".*\\." + ext + '$'))) {
					
						iterator = self.utils.getIterator(pins);

					(function go(){

						var res,
							pl;

						if (iterator.hasNext()){
							pl = iterator.next();
							res = callPlugin(pl);
							res ? 
								(new Promise(res)).then(function (obj) {
									self.userWatch && self.userWatch.call(self, obj, pl);
									self.content_and_name.name = obj.name; //replace the name given by the plugin fo the file produced and to be passed to the next plugin
									self.content_and_name.content = "" + obj.content;
									go();
								}).catch(function (msg){
									console.log(`Plugin '${pl.name}' error: `)
									console.log("\t" + msg);
									Malta.stop();
								})
								:
								go();
						} else {
							plugin4ext(extIterator);
						}
					})();
				} else {
					checknext();
				}	
			} else {
				typeof self.endCb === 'function' &&  self.endCb();
				// console.log('✅')
			}
		})();
	}

	function callPlugin(p) {
		self.log_debug('> ' + p.name.yellow() + (p.params ? ' called passing ' + JSON.stringify(p.params).darkgray() : '') );
		
		self.doBuild = true;
		// actually I dont` need to pass content_and_name, since it can be retrieved by the context,
		// but is better (and I don`t have to modify every plugin and the documentation)
		return p.func.bind(self)(self.content_and_name, p.params);
	}

	// chain
	//
	return this;
};

Malta.prototype.then = function (cb) {
	'use strict';
	this.endCb = cb;
}


/**
 * [checkInvolved description]
 * @return {[type]} [description]
 */
Malta.prototype.checkInvolved = function() {
	'use strict';
	// look for circular inclusion
	// 
	if (this.queue.length > 10 * this.utils.uniquearr(this.queue).length) {
		this.log_info(('OOOOUCH: it seems like running a circular file inclusion ' + NL +
			TAB + 'try to look at the following inclusion queue to spot it quickly:' + NL +
			this.queue).red());
	}

	// look for too many files limit
	// 
	if (this.involvedFiles > this.MAX_INVOLVED) {
		this.log_err(('OUCH: it seems like trying to involve too many files : ' + this.queue.length).white());
	}
};

/**
 * [check description]
 * @param  {[type]} a [description]
 * @return {[type]}   [description]
 */
Malta.prototype.check = function (a) {
	'use strict';
	var i, j, t,
		badArgs = [],
		argTemplate,
		argOutDir,
		buildFile;

	// stop with usage info in case not enough args are given
	//
	a.length < 2 && Malta.log_help();

	t = a[0].match(/#(.*)/);
	if (t) {
		this.demon = false;
		a[0] = t[1];
	}

	this.args = a;
	

	// template and outdir params
	// 
	argTemplate = a[0];

	argOutDir = a[1];

	// check tpl and destination
	// if called badargs will stop malta
	// 
	i = path.resolve(execPath, argTemplate);
	j = path.resolve(execPath, argOutDir);
	
	fs.existsSync(i) || badArgs.push(i);
	fs.existsSync(j) || badArgs.push(j);

	badArgs.length && Malta.badargs.apply(null, badArgs);

	this.tplName = path.basename(argTemplate);
	this.tplPath = path.resolve(execPath, argTemplate);
	this.baseDir = path.dirname(this.tplPath);
	this.tplCnt = fs.readFileSync(this.tplPath).toString();
	this.outDir = path.resolve(execPath, argOutDir);
	this.execDir = execPath;

	if (this.baseDir + "" === this.outDir + "") {
		this.log_err('Output and template directories coincide. Malta won`t overwrite your template'.red());
	}

	this.inName = this.baseDir + DS + this.tplName;
	this.outName = this.outDir + DS + this.tplName;

	t = a.join(' ').match(/proc=(\d*)/);

	this.procNum = t ? t[1] : 0;
	this.proc = "[" + this.procNum + "] " +  this.tplName.white();

	this.args = a.splice(2);

	return this
		.loadOptions()
		.loadPlugins()
		.loadVars();
};

/**
 * [getPluginsManager description]
 * @return {[type]} [description]
 */
Malta.prototype.getPluginsManager = function () {
	'use strict';
	var self = this;

	function add(el, plu, params) {
		// handle * wildcard
		el = el === '*' ? self.tplName.split('.').pop() : el;
		
		if(!(el in self.plugins)) {
			self.plugins[el] = [];
		}
		if (!(plu.name in self.plugins[el])){
			self.plugins[el].push({
				name : plu.name,
				func : plu,
				params : params
			});
		}
	}

	return {
		add : function (fname, params) {

			var reqName = "../plugins/" + fname,
				path = "/../plugins/" + fname  + '.js',
				user_path = execPath + path,
				malta_path = __dirname + path,
				plugin;

			try{
				// first the user execution dir
				// 
				if (fs.existsSync(user_path)) {
					plugin = require(user_path);

				// then check if malta package has it
				//
				} else if (fs.existsSync(malta_path)) {
					plugin = require(malta_path);

				// otherwise most likely is available as package if installed
				//
				} else  {
					plugin = require(fname);
				}
			} catch(e){
				console.log(e);
				self.log_err("`"+ fname + "` required plugin not found!");
			} 

			if ('ext' in plugin) {
				if (self.utils.isArray(plugin.ext)) {
					plugin.ext.forEach(function (el, i) {
						add(el, plugin, params);
					});
				} else if (self.utils.isString(plugin.ext)) {
					add(plugin.ext, plugin, params);
				}
			} else {
				add('*', plugin, params);
			}
		}
	};
};	

/**
 * Gets the size.
 *
 * @param      {<type>}   path    The path
 * @return     {boolean}  The size.
 */
Malta.prototype.getSize = function(path) {
	'use strict';
	var byted = fs.statSync(path).size,
		kbyted = byted / 1024;
	return kbyted < 1 ? (byted.toFixed(2) + ' B') : (kbyted.toFixed(2) + ' KB');
};

/**
 * [hasVars description]
 * @return {Boolean} [description]
 */
Malta.prototype.hasVars = function() {
	'use strict';
	return this.vars !== {};
};

/**
 * [loadOptions description]
 * @return {[type]} [description]
 */
Malta.prototype.loadOptions = function () {
	'use strict';
	var self = this,
		allargs = self.args.join(' '),
		tmp,
		opts;
	tmp = allargs.match(/-options=([^\s$]*)/);
	if (tmp && tmp.length && tmp[1]) {
		eval('opts = {' + tmp[1] + '}');
		if ('verbose' in opts) Malta.verbose = parseInt(opts.verbose, 10);
		if ('watchInterval' in opts) Malta.watchInterval = parseInt(opts.watchInterval, 10);
		if ('showPath' in opts) Malta.showPath = !!(opts.showPath);
	}

	
	if (tmp) {
		self.log_debug('Loading options'.yellow());
		self.log_debug(JSON.stringify(opts));
	}
	return this;
};

/**
 * [loadPlugins description]
 * @return {[type]} [description]
 */
Malta.prototype.loadPlugins = function () {
	'use strict';
	var self = this,
		allargs = self.args.join(' '),
		reqs = allargs.match(/-(plugins|require)=([^\s$]*)/),
		p = reqs ? reqs[2].split('...') : [],
		i = 0, l = p.length,
		parts,
		pluginsManager = self.getPluginsManager();

	self.log_debug('Loading plugins'.yellow());

	for (null; i < l; i++) {
		parts = p[i].match(/([^\[]*)(\[(.*)\])?/);
		pluginsManager.add(parts[1], self.utils.jsonFromStr(parts[3]) || false);
		self.hasPlugins = true;
	}

	self.hasPlugins ?
		self.log_dir(self.plugins)
		:
		self.log_debug(('... no plugins needed').white());
	return this;
};

/**
 * [listen description]
 * @param  {[type]} fpath [description]
 * @return {void}       [description]
 */
Malta.prototype.listen = function (fpath) {
	'use strict';
	var self = this;
	// listen to changes
    if (!(fpath in self.files)) {
        self.files[fpath] = self.utils.createEntry(fpath);
    }
};

/**
 * [loadVars description]
 * @return {[type]} [description]
 */
Malta.prototype.loadVars = function () {
	'use strict';
	var self = this,
		allargs = self.args.join(' '),
		tmp;

	// by default search for vars.json in the same folder 
	// of the tpl but if differently specified by a[2]
	// Hint: even if it expected to be in that position
	// it must be prefixed by -vars=json_relative_to_exec_folder
	// 
	self.varPath = self.baseDir + DS + 'vars.json';

	tmp = allargs.match(/-vars=([^\s$]*)/);
	if (tmp) {
		self.varPath = execPath + DS + tmp[1];
	}

	// get the content
	// 
	if (fs.existsSync(self.varPath)) {
		try {
			tmp = self.utils.solveJson(JSON.parse(fs.readFileSync(self.varPath)));
			self.log_debug('Loaded vars file '.yellow() + NL + self.varPath);
			self.vars = tmp;
		} catch (e) {
			self.vars = {};
		}
	} else {
		self.log_debug(('No vars file to load' + NL).yellow());
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
Malta.prototype.notifyAndUnlock = function (start, msg){
	'use strict';
	var self = this,
		end = self.date();

	msg = (!!msg ? (msg + NL) : '') +
		'build #' + this.buildnumber + ' in ' + (end - start + "").white() + 'ms' + NL +
		'watching ' + (self.involvedFiles + "").white() + " files" + NL;

	self.log_info(msg);	
	self.doBuild = false;
}

/**
 * { function_description }
 */
Malta.prototype.delete_result = function () {
	'use strict';
	var self = this;
	console.log(self.outName);
};

/**
 * [parse description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
Malta.prototype.parse = function(path) {
	'use strict';
	var self = this,
		cnt;

	// update cached content and time for that file,
	// that at first cycle will be always the tpl, but
	// then will be any modified file
	// 
	self.files[path] = self.utils.createEntry(path);

	// get updated content
	// 
	cnt = self.files[path].content;
	self.lastEditedFile = path;

	// start recursive dig
	// 
	(function dig(c) {

		// look for files placeholders
		// 
		var els = c.match(new RegExp(self.reg.files, 'gm'));

		if (els) {
			// loop over all found
			//
			for (var i = 0, l = els.length; i < l; i++) {
				var p = els[i].match(new RegExp(self.reg.files)),
					f = p[2],
					tmp,
					fname = f.match(/^\//) ? 
						execPath + f
						:
						self.baseDir + DS + f;

				if (f) {
					if (self.queue[self.queue.length-1] !== fname) self.queue.push(fname);

					// check for circular inclusion
					// 
					self.checkInvolved();

					// if the entry is created, store it 
					// 
					if (tmp = self.utils.createEntry(fname)) {
						self.files[fname] = tmp;

						// and recur to look for inner inclusions
						// 
						dig(self.files[fname].content + "");
					}
				}
			}
		}
	})(cnt + "");

	// chain
	//
	return this;
};

Malta.prototype.microTpl = function (cnt) {

	var rx = {
			outer : /(\<malta\%.*\%malta\>)/gm,
			inner : /\<malta\%(.*)\%malta\>/
		},
		m = cnt.split(rx.outer),
		ev = ['var r = [];'],
		rout = [];

	if (m) {
		m.forEach(function (el){
			var t = el.match(rx.inner);
			if (t) {
				ev.push(t[1]);
			} else {
				el.split(/\n/mg).forEach(function (el2) {
					ev.push('r.push("' + el2.replace(/\"/g, '\\\"') + '")')
				});
			}
		})
		eval(ev.join("\n"));
		
		/*
		// remove empty lines from r
		r = r.filter(function (v) {
			return v.length;
		});
		*/
		return r.join("\n");
	}
	return cnt;
};


/**
 * [replace_all description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_all = function(tpl) {
	'use strict';
	var self = this;

	

	return tpl.replace(new RegExp(self.reg.files, 'g'), function(str, $1, $2, $3, $4) {

		var tmp,
			ext = self.utils.getFileExtension($2),
			innerVars,
			n,
			fname = $2.match(/^\//) ? 
				execPath + $2
				:
				self.baseDir + DS + $2;

		// file not found
		//
		if (!fs.existsSync(fname)) {

			// warn the user through console
			// 
			self.log_info('[WARNING]'.red() + ' missing file ' + fname);

			// file missing, replace a special placeholder
			// if ext is compatible
			// 
			if (ext in self.comments) {
				return self.comments[ext](' ### ' + $2 + ' ### ');
			}

			// remove it
			return '';
		}

		// file exists, and we got indentation (spaces &| tabs)
		// 	
		tmp = self.files[fname].content.toString();


		


		if ($4) {
			innerVars = self.utils.jsonFromStr($4);	
			for (n in innerVars) {
				while (tmp.match(new RegExp('\\\$' + n + '\\\$'))) {
					tmp = tmp.replace(new RegExp('\\\$' + n + '\\\$'), innerVars[n]);								
				}
			}
		}

		// maybe add path tip in build just before file inclusion
		// 
		if (Malta.showPath && ext in self.comments) {
			tmp = self.comments[ext]("[" + Malta.name + "] " + $2) + tmp;
		}

		// add a unit to the involved files count
		// 
		self.involvedFiles += 1;

		// give back indentation, but for xml (just to mantain preformatted content)
		// 
		return ext !== 'xml' ?
			$1 + tmp.replace(/\n/g, NL + $1) :
			tmp;
	});
};

/**
 * [replace_calc description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_calc = function (tpl) {
	'use strict';
	var self = this;
	return tpl.replace(new RegExp(self.reg.calc, 'g'), function(str, $1) {
		return eval($1);
	});
};

/**
 * [replace_vars description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_vars = function(tpl) {
	'use strict';
	var self = this;
	return tpl.replace(new RegExp(self.reg.vars, 'g'), function(str, $1) {
		var t = self.utils.checkns($1 + '', self.vars);
		if (typeof t === 'object') {
			t = JSON.stringify(t);
		}
		return typeof t !== "undefined" ? t : '$' + $1 + '$';
	});
};

/**
 * [replace_wiredvars description]
 * @param  {[type]} tpl [description]
 * @return {[type]}     [description]
 */
Malta.prototype.replace_wiredvars = function(tpl) {
	'use strict';
	var self = this;
	tpl = self.replace_vars(tpl);
	return self.utils.replaceAll(tpl,{
		TIME : self.date().getHours() + ':' + self.date().getMinutes() + ':' + self.date().getSeconds(),
		DATE : self.date().getDate() + '/' + (self.date().getMonth() + 1) + '/' + self.date().getFullYear(),
		YEAR : self.date().getFullYear(),
		FILES : self.involvedFiles,
		NAME : Malta.name,
		VERSION : Malta.version,
		BUILDNUMBER : self.buildnumber,
		FILE : self.tplName
	},{
		delim : ['__', '__']
	});
};

/**
 * Must be called after check, to start Malta demon
 * @param  {function} userWatch this function if specified will be callled at every build
 * @return {void}
 */
Malta.prototype.start = function (userWatch) {
	'use strict';
	var self = this;
	self.varPath && (self.files[self.varPath] = self.utils.createEntry(self.varPath));	
	if (userWatch) self.userWatch = userWatch;
	self.parse(self.tplPath);
	self.demon && self.watch();
	self.build();
	return this;
};

/**
 * [signBuildNumber description]
 * @return {[type]} [description]
 */
Malta.prototype.signBuildNumber = function() {
	'use strict';
	var self = this,
		hidden = true,
		fname = this.baseDir + DS + '.buildNum.json',
		cnt,
		buildno = 0;
	if (!fs.existsSync(fname)) {
		cnt = '{}';
		fs.writeFileSync(fname, cnt);
	}
	try {
		cnt = JSON.parse(fs.readFileSync(fname));

		if (!(self.inName in cnt)) cnt[self.inName] = 0;
		cnt[self.inName] = (parseInt(cnt[self.inName], 10) || 0) + 1
		this.buildnumber = cnt[self.inName];
		fs.writeFileSync(fname, JSON.stringify(cnt));
	} catch(e){
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
Malta.prototype.utils = {

	/**
	 * Creates an entry.
	 *
	 * @param      {<type>}            path    The path
	 * @return     {(Object|boolean)}  { description_of_the_return_value }
	 */
	createEntry: function(path) {
		'use strict';
		if (!fs.existsSync(path)) {
			return false;
		}
		return {
			content: fs.readFileSync(path).toString(),
			time: fs.statSync(path).mtime.getTime(),
			cachevalid: true
		};
	},

	/**
	 * Gets the file extension.
	 *
	 * @param      {<type>}  fname   The filename
	 * @return     {<type>}  The file extension.
	 */
	getFileExtension: function(fname) {
		'use strict';
		return fname.split('.').pop();
	},

	/**
	 * Gets the file time.
	 *
	 * @param      {<type>}  path    The path
	 * @return     {<type>}  The file time.
	 */
	getFileTime: function(path) {
		'use strict';
		return fs.existsSync(path) && fs.statSync(path).mtime.getTime();
	},

	/**
	 * get a unique array given an array
	 *
	 * @param      {<type>}  a       { parameter_description }
	 * @return     {Array}   { description_of_the_return_value }
	 */
	uniquearr: function(a) {
		'use strict';
		var r = [],
			l = a.length,
			i = 0, j;
		for (i = 0; i < l; i++) {
			for (j = i + 1; j < l; j++)
				if (a[i] === a[j]) j = ++i;
			r.push(a[i]);
		}
		return r;
	},

	/**
	 * solves internal references in the json vars file
	 *
	 * @param      {<type>}  obj     The object
	 * @return     {<type>}  { description_of_the_return_value }
	 */
	solveJson: function(obj) {
		'use strict';
		var self = this,
			maxSub = 1E3,
			i = 0;

		return (function _(o) {
			var y, yy;
			for (var j in o) {
				switch (typeof o[j]) {
					case 'string':
						while (y = o[j].match(/\$([A-z0-9-_/.]+)\$/)) {
							o[j] = o[j].replace(
								'$' + y[1] + '$',
								self.checkns(y[1], obj) || ""
							);
							if (i++ > maxSub) {
								console.log('[ERROR] it seems like variable json has looping placeholders!');
								Malta.stop()
							}
						}
						break;
					case 'object':
						o[j] = _(o[j]);
						break;
				}
			}
			return o;
		})(obj);
	},

	/**
	 * checks is a ns exists
	 *
	 * @param      {<type>}           ns      { parameter_description }
	 * @param      {(number|string)}  ctx     The context
	 */
	checkns: function(ns, ctx) {
		'use strict';
		var els = ns.split(/\.|\//),
			i = 0,
			l = els.length;

		ctx = (ctx !== undefined) ? ctx : W;
		
		if (!ns) return ctx;

		for (null; i < l; i += 1) {
			if (typeof ctx[els[i]] !== 'undefined') {
				ctx = ctx[els[i]];
			} else {
				// break it
				return undefined;
			}
		}
		return ctx;
	},

	/**
	 * json from a string
	 *
	 * @param      {string}   s       { parameter_description }
	 * @return     {boolean}  { description_of_the_return_value }
	 */
	jsonFromStr : function (s) {
		'use strict';
		var r;
		if (s === undefined) {
			return false;
		}
		eval('r = {' + s + '}');
		return r;
	},

	/**
	 * [isArray description]
	 * @param  {[type]}  o [description]
	 * @return {Boolean}   [description]
	 */
	isArray : function (o) {
		'use strict';
        if (Array.isArray && Array.isArray(o)) {
            return true;
        }
        var t1 = String(o) !== o,
            t2 = {}.toString.call(o).match(/\[object\sArray\]/);

        return t1 && !!(t2 && t2.length);
    },

    /**
     * [isString description]
     * @param  {[type]}  o [description]
     * @return {Boolean}   [description]
     */
    isString : function(o) {
    	'use strict';
        return typeof o === 'string' || o instanceof String;
    },
	
	/**
	 * [getIterator description]
	 * @param  {[type]} els [description]
	 * @return {[type]}     [description]
	 */
	getIterator : function (els) {
		'use strict';
		var i = 0,
			l = els.length;
		return {
			hasNext : function () {
				return i < l;
			},
			next : function () {
				var r = els[i];
				i++;
				return r;
			},
			size : function () {
				return els.length;
			}
		};
	},

	/**
	 * [replaceAll description]
	 * @param  {[type]} tpl     [description]
	 * @param  {[type]} obj     [description]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	replaceAll : function (tpl, obj, options) {
		'use strict';
        var self = this,
        	start = '%',
            end = '%',
            fb = null,
            clean = false,
            reg,
            straight = true,
            str, tmp, last;

        if ('undefined' !== typeof options) {
            if ('delim' in options) {
                start = options.delim[0];
                end = options.delim[1];
            }
            if ('fb' in options) {
                fb = options.fb;
            }
            clean = !!options.clean;
        }

        reg = new RegExp(start + '(\\\+)?([A-z0-9-_\.]*)' + end, 'g');

        while (straight) {
            if (!(tpl.match(reg))) {
                return tpl;
            }
            tpl = tpl.replace(reg, function (str, enc, $1, _t) {
                
                if (typeof obj === 'function') {
                    /**
                     * avoid silly infiloops */
                    tmp = obj($1);
                    _t = (tmp !== start + $1 + end) ? obj($1) : $1;

                } else if ($1 in obj) {

                    _t = typeof obj[$1];
                    if (_t === 'function') {
                        _t = obj[$1]($1);
                    } else if (_t === 'object') {
                        _t = '';
                    } else {
                        _t= obj[$1];
                    }
                    // incomplete when the placeholder points to a object (would print)
                    // _t = typeof obj[$1] === 'function' ? obj[$1]($1) : obj[$1];
                    
                /**
                 * not a function and not found in literal
                 * use fallback if passed or get back the placeholder
                 * switching off before returning
                 */
                } else {
                    /* @ least check for ns, in case of dots
                    */
                    if ($1.match(/\./)) {
                        last = self.checkns($1 ,obj);
                        if (last) {
                            _t = enc ? encodeURIComponent(last) : last;
                            return typeof last === 'function' ? last($1) : last;
                        }
                    }
                    // but do not go deeper   
                    straight = false;
                    _t = fb !== null ? fb : clean ? '' : start + $1 + end;
                }
                return enc ? encodeURIComponent(_t): _t;
            });
        }
        return tpl;
    }
};

/**
 * [watch description]
 * @return {[type]} [description]
 */
Malta.prototype.watch = function() {
	'use strict';


	var self = this,
		d, f;

	function watch() {
		// empty queue
		//
		self.queue = [];

		for (f in self.files) {
			// if the file has been removed
			//
			if (!fs.existsSync(f)){
				self.shut();
				console.log('REMOVED '.yellow() + f + NL);

			// something changed ?
			//
			} else if (self.files[f].time < self.utils.getFileTime(f)) {
				d = self.date();

				self.log_info('[' + 'MODIFIED'.yellow() + ' @ ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ' + f.replace(self.baseDir + DS, '').underline());
				// renew entry
				// 
				self.files[f] = self.utils.createEntry(f);

				// active flag rebuild
				// 
				self.doBuild = true;

				// if it`s vars .json reload it
				// 
				if (f === self.varPath) {
					// update vars
					// 
					self.vars = self.utils.solveJson(JSON.parse(fs.readFileSync(self.varPath)));
				}

				self.parse(f);
			}
		}
		self.doBuild && self.build();
	}

	// every second, if nothing is building, watch files
	// 
	self.log_debug('Watch interval used : '.yellow() + (''+Malta.watchInterval).red() );

	// save the interval fucntion so that if the element is removed (wildcard)
	// then the interval is cleared by the shut function
	// 

	this.watch_TI = setInterval(function() {
		!self.doBuild && watch();
	}, Malta.watchInterval);

	// chain
	//
	return this;
};

Malta.prototype.shut = function () {
	'use strict';
	clearInterval(this.watch_TI);
}

// be sure to call malta stop when the user CTRL+C
//
process.on('SIGINT', Malta.stop);

module.exports = Malta;