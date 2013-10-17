#!/usr/bin/env node
/**
 *  Malta
 */
var fs = require("fs"),
	path = require("path"),
	uglify = require("uglify-js"),
	
	//path from where Malta is started
	execRoot = process.cwd(),
	
	// commandline arguments array
	args = process.argv.splice(2),

	// get package info
	packageInfo = fs.existsSync(__dirname + '/package.json') ? require(__dirname + '/package.json') : {},
	
	//directory separator, linefeed, tab
	DS = '/',
	NL = "\n",
	TAB = "\t";

// constructor
function Malta() {};

//proto
Malta.prototype = {
	// security nesting level
	MAX_NESTING : 100,

	// cursor for current nesting
	currentNesting : 0,
	
	// name and version from package json
	name : 'name' in packageInfo ? packageInfo.name : 'Malta',
	version : 'version' in packageInfo ? packageInfo.version : 'x.y.z',
	
	// path for the vars.json
	varPath : '',
	// register for the content of vars.json, if found
	vars : {},
	
	// basename for the base template, path and content
	tplName : '',
	tplPath : '',       
	tplCnt : '',
	
	// base dir from where placeholder will start
	// will be always equal to the base template folder
	baseDir : '',
	
	// output directory written files
	outDir : '',
	// names for out files
	outName : {},
	
	// to store the last involved file while parsing,
	// used to have more info when an exception occours
	// or is fired from Malta
	lastEditedFile : false,
	
	// this is the container for all files involved
	// items are as following
	// path-of-file : {content: the-content-of-file, time: last-edit-time} 
	files : {},
	
	// that array is filled when diggin the base template looking
	// for file placeholders, and emptied at the end of digging
	// used to show the list of found file placeholders when Malta
	// suppose a circular inclusion
	queue : [],

	//for sure the template
	involvedFiles : 1, 

	// every second the watch function loops over files literal 
	// triggering the build as far as t least one file is updated
	// (checking the distance from stored file time and current file time)
	// when the build is fired, watch pauses inner execution, until
	// the build ends, the build function at the end will set that
	// value back to true, allowing watch to execute again time checks
	// on files
	doBuild : true,
	
	// a flag for inner debug (used for development)
	debug : false,

	// basic string used to create regular expressions for
	// finding file and variable placeholder
	reg : {
		files : '(.*)\\\$\\\$([A-z0-9-_/.]*)\\\$\\\$',
		vars : '\\\$([A-z0-9-_/.]*)\\\$'
	},

	// date function used to show elapsed time for creation,
	// and eve for wired time placeholders
	// __TIME__ , __DATE__ , __YEAR__
	date : function () { return new Date(); },

	// time spend to build
	t2b : 0,


	/**
	 * Check if the upper limit of nested placeholder
	 * has been violated, in case shows a message useful
	 * to find immediately where circular inclusion rises,
	 * and exit Malta
	 * 
	 * @return {void}
	 */
	_checkNesting : function () {
		if (this.currentNesting++ > this.MAX_NESTING) {
			console.log('OUCH: it seems like running a circular file inclusion]');
			console.log(TAB + 'try to look at the following inclusion queue to spot it quickly:');
			console.log(this.queue.slice(this.MAX_NESTING - 10));
			console.log('MALTA has stoppend' + NL);
			process.exit();
		}
	},

	/**
	 * Builds the file, and the minifiled in case of js
	 * @return {void}
	 */
	_build : function () {
		
		this.involvedFiles = 1;

		var self = this,

			// updated tpl
			baseTplContent = self.files[self.tplPath].content,
			
			// replacing functions for files and vars
			replace = {
				all : function (tpl) {
					var str;
					return tpl.replace(new RegExp(self.reg.files, 'g'), function (str, $1, $2) {

						// if the file doesn`t exists, replace with a placeholder
						// /*###  ###*/
						if (!fs.existsSync(self.baseDir + DS + $2)) {
							// file missing, replace a special placeholder
							// with no indentation
							console.log('[WARNING] missing file ' + self.baseDir + DS + $2);
							return '/*### ' + $2 + ' ###*/';
						}

						//
						

						// file exists, and we got indentation (spaces &| tabs)			
						var tmp = fs.readFileSync(self.baseDir + DS + $2);

						self.involvedFiles += 1;
						// give back indentation
						return $1 + tmp.toString().replace(/\n/g, NL + $1);
					});
				},
				vars : function (tpl) {
					var str;
					return tpl.replace(new RegExp(self.reg.vars, 'g'), function (str, $1) {
						return ($1 in self.vars) ? self.vars[$1] : $1;
					});
				}
			},
			start = self.date(),
			end,
			msg;





		


		// main
		while (baseTplContent.match(new RegExp(self.reg.files, 'g'))) {
			baseTplContent = replace.all(baseTplContent);
		}

		// wiredvars
		baseTplContent = replace.vars(baseTplContent)
			.replace(/__TIME__/g, self.date().getHours() + ':' + self.date().getMinutes() + ':' + self.date().getSeconds())
			.replace(/__DATE__/g, self.date().getDate() + '/' + (self.date().getMonth() + 1) + '/' + self.date().getFullYear())
			.replace(/__YEAR__/g, self.date().getFullYear());


		// write
		fs.writeFile(self.outName.clear, baseTplContent, function(err) {
			var d = self.date(),
				data = d.getHours() + ':' + d.getMinutes()  + ':' + d.getSeconds();

			msg = '[' + data + ']' + NL +'wrote ' + self.outName.clear + ' ('+ getSize(self.outName.clear) + ' KB)' + NL;

			// if has js extension use uglify-js to get even the minified version
			if (self.outName.clear.match(/\.js$/)) {
				try {
					fs.writeFile(self.outName.min, uglify.minify(self.outName.clear).code, function(err) {
						if (!err) {
							msg += 'wrote ' + self.outName.min + ' ('+ getSize(self.outName.min) + ' KB)' + NL;
						}else{
							console.log('[ERROR] uglify-js says:' );
							console.dir(err);
							process.exit();
						}
						warnAndUnlock();
					});
				} catch(e) {
					console.log('[PARSE ERROR: uglify] ' + e.message + ' @' + e.line + ' maybe on ' + self.lastEditedFile);
					console.log('[WARN: Minified version skipped]');
					warnAndUnlock();
				}
			} else {
				end = self.date();
				warnAndUnlock();
			}
			
		});

		// get size of file
		function getSize(path) {
			return fs.statSync(path).size >> 10;
		}

		// prints out the middle
		// file just after build
		// 
		function warnAndUnlock() {
			end = self.date();
			msg += 'in ' + (end-start) + 'ms' + NL;
			msg += '---------------------------' + NL;
			self.involvedFiles += ~~self._hasVars();
			msg += 'watching ' + self.involvedFiles + " files";
			console.log(msg);
			msg = '';
			self.doBuild = false;
			
			
		}
	},


	/*
		_parse (file):
		//> popolo files con il loro content e time,
		//  aggiungendo se non presenti
		//  e aggiornando se il time é diverso dal precedente
		//  
	*/

	/**
	 * [_parse description]
	 * @param  {string} path the complete path of the file that has been modified,
	 *                       thus Malta look inside tha file to look for relevant updates
	 *                       and reflects that on the files register        
	 * @return {void}
	 */
	_parse : function (path) {
		var self = this;



		// update caceh content and time
		self.files[path] = self._utils.createEntry(path);

		// get updated content
		cnt = self.files[path].content;

		self.lastEditedFile = path;

		self.currentNesting = 0;

		// start recursive dig
		(function dig(c){
			
			var els = c.match(new RegExp(self.reg.files, 'g'));
			if (els) {
				for (var i = 0, l = els.length; i < l; i++) {
					var p  = els[i].match(new RegExp(self.reg.files)),
						f = p[2],
						tmp;
					
					if (f) {
						self.queue.push(self.baseDir + DS + f);

						self._checkNesting();
						tmp = self._utils.createEntry(self.baseDir + DS + f);
						
						if (tmp) {
							
							self.files[self.baseDir + DS + f] = tmp;
							dig(self.files[self.baseDir + DS + f].content + "");
						}
					}
				}
			}
		})(cnt + "");

	},


	/**
	 * Watch through files and trigger parse on each file modified
	 * if at least one file has been modified, lock the inner
	 * watch execution until build ends and fires build
	 * 
	 * 
	 * @return {[type]} [description]
	 */
	_watch : function () {
		var self = this;
		
		function watch() {
			self.queue = [];
			for (f in self.files) {
				
				if (self.files[f].time < self._utils.getFileTime(f)) {
					
					self.doBuild = true;

					//if it`s vars .json reload it
					if (f === self.varPath) {
						//update vars
						self.vars = JSON.parse(fs.readFileSync(self.varPath));

					}
					
					self._parse(f);
				}
			}
			self.doBuild && self._build();
		}
		//every second, if nothing is building, watch files
		setInterval(function () {
			!self.doBuild && watch();
		}, 1000);
	},



	/**
	 * Starts parsing of base template
	 * starts watch and first build
	 * @return {[type]} [description]
	 */
	start : function () {
		var self = this;

		console.log(self.name + ' v.' + self.version);        
		// if exists add vars.json to watched files
		self.varPath && (self.files[self.varPath] = self._utils.createEntry(self.varPath));

		self._parse(self.tplPath);

		self._watch();
		
		self._build();
	},
	

	_hasVars : function () {
		return this.vars !== {};
	},

	/**
	 * check cmd params
	 * @return {instance} Malta instance
	 */
	check : function (a) {
		var tmp,
			argTemplate,
			argOutDir;

		if (a.length < 2) {
			console.log(NL + 'Usage : malta [templatefile] [outdir]');
			console.log(NL)
			process.exit();
		}

		//template and outdir params
		argTemplate = args[0];
		argOutDir = args[1];
		
		this.tplName = path.basename(argTemplate);
		this.tplPath = path.resolve(execRoot, argTemplate);
		this.baseDir = path.dirname(this.tplPath);

		if (!fs.existsSync(this.tplPath)) {
			console.log('Template `' + this.tplPath + '` NOT FOUND!');
			process.exit(); 
		}
		
		this.tplCnt = fs.readFileSync(this.tplPath).toString();
		this.outDir = path.resolve(execRoot, argOutDir);

		if (!fs.existsSync(this.outDir)) {
			console.log('OutDir `' + this.outDir + '` NOT FOUND!');
			process.exit(); 
		}

		if (this.baseDir + "" == this.outDir + "") {
			console.log('[ERROR] Output and template directories coincide. Malta won`t overwrite your template');
			process.exit();
		}
		
		tmp = path.extname(this.tplName);

		this.outName = {
			"clear" : this.outDir + DS +  this.tplName,
			"min" : (this.outDir + DS +  this.tplName).replace(tmp, '.min' + tmp)
		};
		
		//check vars.json
		this.varPath = this.baseDir + DS + 'vars.json';

		if (fs.existsSync(this.varPath)) {
			try {
				this.vars = JSON.parse(fs.readFileSync(this.varPath));
			} catch (e) {
				this.vars = {};
			}
		} else {
			console.log('[INFO] No ' + this.varPath + ' file found');
			this.varPath = false;
		}
		
		// params validated 
		// chain for run
		return this;
	},

	/**
	 * [_utils description]
	 * @type {Object}
	 */
	_utils : {
		createEntry : function (path) {
			if(!fs.existsSync(path)){
				return false;
			}
			return {
				content : fs.readFileSync(path).toString(),
				time : fs.statSync(path).mtime.getTime()
			};
		},
		getFileTime : function (path) {
			return fs.existsSync(path) && fs.statSync(path).mtime.getTime();
		}

	}

}

// start Malta
new Malta().check(args).start();


