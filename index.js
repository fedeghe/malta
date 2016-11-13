#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	child_process = require('child_process'),
	readline = require('readline'),
	execPath = process.cwd(),
	args = process.argv.splice(2),
	packageInfo = fs.existsSync(__dirname + '/package.json') ? require(__dirname + '/package.json') : {},
	DS = path.sep,
	NL = "\n",
	TAB = "\t";

// string proto for console colors

require('./lib/stringproto');

/**
 * Malta is the main object that will watch for modifications and build when needed
 * @class      Malta (name)
 * @return     {Object}  The instance of Malta 
 */
function Malta () {
	'use strict';
	
	this.args = [];

	// security nesting level
	// 
	this.MAX_INVOLVED = 5E3;

	// name and version from package json
	// 
	this.buildnumber = null;

	// path for the vars.json
	// 
	this.varPath = '';

	// register for the content of vars.json, if found
	// 
	this.vars = {};

	// basename for the base template, path and content
	// 
	this.tplName = '';
	this.tplPath = '';
	this.tplCnt = '';

	// base dir from where placeholder will start
	// will be always equal to the base template folder
	// 
	this.baseDir = '';

	// output directory written files
	// 
	this.outDir = '';

	// execution directory
	//
	this.execDir = '';

	// names for in/out files
	// 
	this.inName = '';
	this.outName = '';

	// to store the last involved file while parsing,
	// used to have more info when an exception occours
	// or is fired from Malta
	// 
	this.lastEditedFile = false;

	// this is the container for all files involved
	// items are as following
	// path-of-file : {content: the-content-of-file, time: last-edit-time} 
	// 
	this.files = {};

	// that array is filled when diggin the base template looking
	// for file placeholders, and emptied at the end of digging
	// used to show the list of found file placeholders when Malta
	// suppose a circular inclusion
	// 
	this.queue = [];

	// for sure the template
	// 
	this.involvedFiles = 1;

	// every second the watch function loops over files literal 
	// triggering the build as far as t least one file is updated
	// (checking the distance from stored file time and current file time)
	// when the build is fired, watch pauses inner execution, until
	// the build ends, the build function at the end will set that
	// value back to true, allowing watch to execute again time checks
	// on files
	// 
	this.doBuild = true;

	// plugins container
	// 
	this.plugins = {};

	// just a flag to know if plugins are required
	// 
	this.hasPlugins = false;
	
	// date function used to show elapsed time for creation,
	// and eve for wired time placeholders
	// __TIME__ , __DATE__ , __YEAR__
	// 
	this.date = function() {return new Date(); };

	// time spend to build
	// 
	this.t2b = 0;

	// to recognise the process
	//
	this.proc = '';

	// should print the version on console?
	//
	this.printVersion = false;

	// maybe the user has passed a watch function at the start function
	// in this case it is stored here
	//
	this.userWatch = false;
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


// default values for all options that can be passed throug the
// -options parameter
// 
Malta.watchInterval = 1E3;

//0 nothing
//1 some
//2 a lot
Malta.verbose = 1; 

Malta.showPath = true;
// Malta.stealth = false;


/**
 * [badargs description]
 * @param  {[type]} tpl [description]
 * @param  {[type]} dst [description]
 * @return {[type]}     [description]
 */
Malta.badargs = function (tpl, dst) {
	'use strict';
	console.log(Malta.name + ' v.' + Malta.version);
	console.log(('ERR : It looks like' + NL +
		(tpl ? tpl + NL : "") + 
		(dst ? dst + NL : "") + 
		'can`t be found!' + NL + 
		'... check, fix and rerun' + NL ).red());
	process.exit();
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
	console.log(this.proc + msg);
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
	console.log(this.proc + ' ' + JSON.stringify(msg));
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
	console.log(this.proc + msg);
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
	console.log(this.proc + msg);
};

/**
 * [log_err description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
Malta.prototype.log_err = function (msg) {
	'use strict';
	if (Malta.verbose > 0){
		console.log(this.proc + "[ERROR]: ".red() + msg.red());
	}
	process.exit();
};

/**
 * [log_help description]
 * @return {[type]} [description]
 */
Malta.prototype.log_help = function () {
	'use strict';
	console.log(Malta.name + ' v.' + Malta.version);
	console.log(NL + 'Usage : malta [templatefile] [outdir] {options}');
	console.log('   OR   malta [buildfile.json]' + NL);
	process.exit();
};

/**
 * basic string used to create regular expressions for
 * finding file, variable and executable placeholder
 * @type {Object}
 */
Malta.prototype.reg = {
	files: '(.*)\\\$\\\$([A-z0-9-_/.]+)({([^}]*)})?\\\$\\\$',
	vars: '\\\$([A-z0-9-_/.]+)\\\$',
	calc : '\!{([^{}]*)}\!'
};

/**
 * [comments description]
 * @type {Object}
 */
Malta.prototype.comments = {
	'html':	"<!--\n%content%\n-->\n",
	'xml': "<!--\n%content%\n-->\n",
	'svg': "<!--\n%content%\n-->\n",
	'pug': "//\n// %content%\n//\n",
	'js': "/*\n%content%\n*/\n",
	'css': "/*\n%content%\n*/\n",
	'less': "/*\n%content%\n*/\n",
	'scss': "/*\n%content%\n*/\n",
	'php': "/*\n%content%\n*/\n",
	'java': "/*\n%content%\n*/\n",
	'ts': "/*\n%content%\n*/\n"
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
		ext,
		content_and_name = {
			content : null,
			name : null
		};
	// for sure the tpl is involved
	self.involvedFiles = 1;

	self.signBuildNumber();

	self.involvedFiles += self.hasVars();

	while (baseTplContent.match(new RegExp(self.reg.files, 'g'))) baseTplContent = self.replace_all(baseTplContent);

	// wiredvars
	// 
	baseTplContent = self.replace_vars(baseTplContent);
	baseTplContent = self.replace_wiredvars(baseTplContent);
	baseTplContent = self.replace_calc(baseTplContent);

	content_and_name.content = baseTplContent;
	content_and_name.name = self.outName;

	// do write
	// 
	fs.writeFile(self.outName, content_and_name.content, function(err) {
		var d = self.date(),
			data = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(),
			msg = '';

		msg += 'Build ' + self.buildnumber + ' @ ' + data + NL + NL;
		msg += 'wrote ' + self.outName + ' (' + self.getSize(self.outName) + ')';
		end = self.date();
		
		self.notifyAndUnlock(start, msg);

		self.userWatch && self.userWatch.call(self, content_and_name);

		doPlugin();
	});

	function doPlugin() {
		var pluginKeys = Object.keys(self.plugins);
		
		pluginKeys.length && self.log_info('Starting plugins');

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
				if (self.outName.match(new RegExp(".*\." + ext + '$'))) {
					iterator = self.utils.getIterator(pins);
					(function go(){
						var res,
							pl;
						if (iterator.hasNext()){
							pl = iterator.next();
							res = callPlugin(pl);
							res ? 
								new Promise(res).then(function (obj) {
									obj.plugin = pl.name;
									self.userWatch && self.userWatch.call(self, obj);
									content_and_name.name = obj.name; //replace the name given by the plugin fo the file produced and to be passed to the next plugin
									content_and_name.content = obj.content;
									go();
								})
								:
								go();
						} else {
							extIterator.hasNext() && plugin4ext(extIterator);
						}
					})();
				} else {
					checknext();
				}	
			}
		})();
	}

	function callPlugin(p) {
		self.log_debug('> ' + p.name.yellow() + (p.params ? ' called passing ' + JSON.stringify(p.params).darkgray() : '') );
		self.doBuild = true;
		return p.func.bind(self)(content_and_name, p.params);
	}

	// chain
	//
	return this;
};

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
		proc,
		buildFile;
	
	this.printVersion = a.indexOf('do_not_print_version') < 0;

	this.args = a;

	// stop with usage info in case not enough args are given
	//
	a.length < 2 && this.log_help();

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

	
	this.args = a.splice(2);

	this.tplName = path.basename(argTemplate);
	this.tplPath = path.resolve(execPath, argTemplate);
	this.baseDir = path.dirname(this.tplPath);
	this.tplCnt = fs.readFileSync(this.tplPath).toString();
	this.outDir = path.resolve(execPath, argOutDir);
	this.execDir = execPath;

	proc = this.args.join(',').match(/proc=(\d)*/);
	if (proc) {
		this.proc = parseInt(proc[1], 10) + '(' + this.tplName + ') : ';
	}

	if (this.baseDir + "" === this.outDir + "") {
		this.log_err('Output and template directories coincide. Malta won`t overwrite your template');
	}

	this.inName = this.baseDir + DS + this.tplName;
	this.outName = this.outDir + DS + this.tplName;

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

			var reqName = "./plugins/" + fname,
				path = "/plugins/" + fname  + '.js',
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
	
	// depends on verbose!!!.. .so now is the moment
	
	Malta.verbose && self.printVersion && Malta.outVersion();
	
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
		self.log_debug('No vars file to load'.yellow());
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
		tmp = ('watching ' + self.involvedFiles + " files").white(),
	end = self.date();
	
	msg = !!msg ? (msg + NL) : '';

	msg += 'build #' + this.buildnumber;
	msg += ' in ' + (end - start) + 'ms' + NL;
	msg += tmp + NL;
	self.log_info(msg);
	self.doBuild = false;
}

/**
 * { function_description }
 * @static
 */
Malta.outVersion = function () {
	'use strict';
	if (Malta.verbose === 0) return;
	var str = Malta.name.rainbow() + ' v.' + Malta.version,
		l = (Malta.name + ' v.' + Malta.version).length + 4,
		top = NL +
			"╔" + (new Array(l-1)).join("═") + "╗" + NL +
			"║" +      ' ' + str + ' '       + "║" + NL + 
			"╚" + (new Array(l-1)).join("═") + "╝" + NL;
	console.log(top);
}

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
			self.log_info('[WARNING] missing file ' + fname);

			// file missing, replace a special placeholder
			// if ext is compatible
			// 
			if (ext in self.comments) {
				return self.comments[ext].replace('%content%', ' ### ' + $2 + ' ### ');
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
			tmp = self.comments[ext].replace('%content%', "[MALTA] " + $2) + tmp;
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
		BUILDNUMBER : self.buildnumber	
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
	self.parse(self.tplPath)
		.watch()
		.build();
};

/**
 * [signBuildNumber description]
 * @return {[type]} [description]
 */
Malta.prototype.signBuildNumber = function() {
	'use strict';
	var hidden = true,
		fname = this.baseDir + DS + (hidden ? '.' : '') + this.tplName.replace(/\./, '') + '.buildNum',
		buildno = 0;
	if (!fs.existsSync(fname)) {
		fs.writeFileSync(fname, ++buildno);
	} else {
		buildno = parseInt(fs.readFileSync(fname), 10) + 1;
	}
	this.buildnumber = buildno;
	fs.writeFileSync(fname, buildno);
};

/**
 * [stop description]
 * @return {[type]} [description]
 */
Malta.prototype.stop =  function() {
	'use strict';
	console.log('MALTA has stopped' + NL);
	process.exit();
};

/**
 * [utils description]
 * @type {Object}
 */
Malta.prototype.utils = {
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

	getFileExtension: function(fname) {
		'use strict';
		return fname.split('.').pop();
	},

	getFileTime: function(path) {
		'use strict';
		return fs.existsSync(path) && fs.statSync(path).mtime.getTime();
	},

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

	// experimenting some kind of dummy local minifier
	//
	clean: function(s) {
		'use strict';
		// inline
		return s.replace(/^[\s\t]*\/\/.*(?=[\n\r])/gm, '');
	},

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
								process.exit();
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

			// somwthing changed
			//
			if (self.files[f].time < self.utils.getFileTime(f)) {
				d = self.date();

				self.log_info('[MODIFIED @ ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ' + f.replace(self.baseDir + DS, ''));
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
					// self.vars = JSON.parse(fs.readFileSync(self.varPath));
				}

				self.parse(f);
			}
		}
		self.doBuild && self.build();
	}

	// every second, if nothing is building, watch files
	// 
	self.log_debug('Watch interval used : '.yellow() + (''+Malta.watchInterval).red() );
	setInterval(function() {
		!self.doBuild && watch();
	}, Malta.watchInterval);

	// chain
	//
	return this;
};

















/**
 * { function_description }
 * 
 * @static
 * @return     {Object}  { description_of_the_return_value }
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
				msg : "\n" + deps[i].underline() + " package is needed"+
		    		"\nby a plugin "+
		    		"\nbut cannot be found".italic()+
		    		("\nrun `npm install " + deps[i] + "`").yellow()
			});
		}
	}
	for (i=0, l = errs.length; i < l; i++) {
		console.log(errs[i].err.code.red() + ': ' + errs[i].msg);
	}
	errs.length && process.exit();
	return this;
}

/**
 * { function_description }
 * @static
 * @memberof Malta
 * @param      {string}  ex      { parameter_description }
 * @return     {Object}  { description_of_the_return_value }
 */
Malta.checkExec = function (ex) {
	'use strict';
	var err;

	child_process.exec("which " + ex, function (error, stdout, stderr) {
		if (error !== null) {
			err = {
				err : error + '',
				msg : "\n" + ex.underline() + " executable is needed"+
					"\nbut cannot be found".italic()+
					("\ninstall `" + ex  + "` and try again").yellow()
			};
			console.log(err.err.red() + ' ' + err.msg);
			process.exit();
		}
	});
	return this;
};

/**
 * { function_description }
 * 
 * @static
 * @return     {Malta}  { description_of_the_return_value }
 */
Malta.get = function () {
	return new Malta;
}

module.exports = Malta;


var j = 0;

if (args.length === 1) {

	var p = path.resolve(execPath, args[0]),
		runs = fs.existsSync(p) ? require(p) : false,
		tpl;

	// check
	// 
	!runs && Malta.badargs(p);
	
	for (tpl in runs) {
		//skip if key begins with !
		if (tpl.match(/^\!/)) continue;
		start(tpl, runs[tpl]);
	}
} else if (args.length > 1){
	Malta.get().check(args).start();

}

function start(key, el) {
	var opts = ['proc=' + j],
		ls;

	if (j>0) {
		opts.push('do_not_print_version');
	}
	j++;

	ls = child_process.spawn('malta', [key].concat(el.split(/\s/)).concat(opts));
	
	ls.stdout.on('data', function(data) {
		console.log(data + "");
	});

	ls.stderr.on('error', function (data) {
		console.log('stderr: ' + data);
	});
}

