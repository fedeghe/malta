#!/usr/bin/env node

/**
 *  Malta
 */
var fs = require("fs"),
	path = require("path"),
	child_process = require('child_process'),

	uglify_js = require("uglify-js"),
	uglify_css = require("uglifycss"),
	markdown = require("markdown").markdown,
	markdownpdf = require("markdown-pdf"),
	svg_to_png = require('svg-to-png'),
	less = require("less"),
	sass = require("sass"),
	packer = require("packer"),
	

	// path from where Malta is started
	// 
	execRoot = process.cwd(),

	// commandline arguments array
	// 
	args = process.argv.splice(2),

	// get package info
	// 
	packageInfo = fs.existsSync(__dirname + '/package.json') ? require(__dirname + '/package.json') : {},

	// directory separator, linefeed, tab
	// 
	DS = path.sep,
	NL = "\n",
	TAB = "\t",
	watchInterval = 1E3

// zebra constructor
// 
function Malta() {



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

	// names for out files
	// 
	this.outName = {};

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

	// a flag for inner debug (used for development)
	// 
	this.debug = false;


	this.js_base62 = true;
	this.js_shrink = false;

	/*

	.js tpl 						| .css OR/AND .less tpl 
	--------------------------------+----------------------
	0 > .js 						| .css
	1 > .js & .min.js 				| .css & .min.css 		<<<<<<<<< DEFAULT
	2 > .js & .pack.js 				| DEFAULT (1)
	3 > .js & .min.js & .pack.js 	| DEFAULT (1)

 	 */
	this.outVersion = 1;

	// date function used to show elapsed time for creation,
	// and eve for wired time placeholders
	// __TIME__ , __DATE__ , __YEAR__
	// 
	this.date = function() {return new Date(); };

	// time spend to build
	// 
	this.t2b = 0;

};
Malta.name = 'name' in packageInfo ? packageInfo.name : 'Malta';
Malta.version = 'version' in packageInfo ? packageInfo.version : 'x.y.z';

// proto
// 
Malta.prototype = {

	started: false,

	// basic string used to create regular expressions for
	// finding file and variable placeholder
	// 
	reg: {
		files: '(.*)\\\$\\\$([A-z0-9-_/.]+)\\\$\\\$',
		vars: '\\\$([A-z0-9-_/.]+)\\\$',
		calc : '\!{([^{}]*)}\!'
	},

	comments: {
		xml: "<!--\n%content%\n-->\n",
		svg: "<!--\n%content%\n-->\n",
		js: "/*\n%content%\n*/\n",
		css: "/*\n%content%\n*/\n",
		less: "/*\n%content%\n*/\n",
		scss: "/*\n%content%\n*/\n"
	},

	_stop: function() {
		console.log('MALTA has stopped' + NL);
		process.exit();
	},

	/**
	 * Check if the upper limit of nested placeholder
	 * has been violated, in case shows a message useful
	 * to find immediately where circular inclusion rises,
	 * and exit Malta
	 * 
	 * @return {void}
	 */
	_checkInvolved: function() {

		// look for circular inclusion
		// 
		if (this.queue.length !== this._utils.uniquearr(this.queue).length) {

			// notify the queue and exit
			// 
			console.log('OOOOUCH: it seems like running a circular file inclusion]');
			console.log(TAB + 'try to look at the following inclusion queue to spot it quickly:');
			console.log(this.queue);

			// from 2.0.0 won't stop anymore for it
			// this._stop();
		}

		// look for too many files limit
		// 
		if (this.involvedFiles > this.MAX_INVOLVED) {

			// notify limit reached and exit
			// 
			console.log('OUCH: it seems like trying to involve too many files : ' + this.queue.length + ' ]');
			this._stop();
		}
	},

	/**
	 * Builds the file, and the minifiled in case of js
	 * @return {void}
	 */
	_build: function() {

		// for sure the tpl is involved
		// 
		this.involvedFiles = 1;

		this._signBuildNumber();

		var self = this,

			// updated tpl
			// 
			baseTplContent = self.files[self.tplPath].content,

			// replacing functions for files and vars
			// 
			replace = {
				all: function(tpl) {
					var str;
					return tpl.replace(new RegExp(self.reg.files, 'g'), function(str, $1, $2) {

						var tmp,
							ext = self._utils.getFileExtension($2),
							fname;
						if ($2.match(/^\//)) {
							fname = execRoot + $2
						} else {
							fname = self.baseDir + DS + $2;
						}

						// file not found
						//
						if (!fs.existsSync(fname)) {

							// warn the user through console
							// 
							console.log('[WARNING] missing file ' + fname);

							// file missing, replace a special placeholder
							// if ext is compatible
							// 
							if (ext in self.comments) {
								return self.comments[ext].replace('%content%', ' ### ' + $2 + ' ### ');
							}

							// the extension is not yet cosidered
							// the placeholder is removed
							// 
							return '';
						}




						// file exists, and we got indentation (spaces &| tabs)
						// 	
						tmp = self.files[fname].content.toString();

						// maybe add path tip in build just before file inclusion
						// 
						if (ext in self.comments) {
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
				},
				vars: function(tpl) {
					var str;

					return tpl.replace(new RegExp(self.reg.vars, 'g'), function(str, $1) {
						var t = self._utils.checkns($1 + '', self.vars);
						if (typeof t === 'object') {
							t = JSON.stringify(t);
						}
						return typeof t !== "undefined" ? t : '$' + $1 + '$';
						// return ($1 in self.vars) ? self.vars[$1] : '$' + $1 + '$';

					});
				},
				calc : function (tpl) {
					return tpl.replace(new RegExp(self.reg.calc, 'g'), function(str, $1) {
						return eval($1);
					});
				}
			},
			start = self.date(),
			end,
			msg,
			ext;

		// if hasVars the add the file to the count
		// 
		self.involvedFiles += ~~self._hasVars();


		// main
		// 
		while (baseTplContent.match(new RegExp(self.reg.files, 'g'))) {
			baseTplContent = replace.all(baseTplContent);
		}

		// wiredvars
		// 
		baseTplContent = replace.vars(baseTplContent)
			.replace(/__TIME__/g, self.date().getHours() + ':' + self.date().getMinutes() + ':' + self.date().getSeconds())
			.replace(/__DATE__/g, self.date().getDate() + '/' + (self.date().getMonth() + 1) + '/' + self.date().getFullYear())
			.replace(/__YEAR__/g, self.date().getFullYear())
			.replace(/__FILES__/g, self.involvedFiles)
			.replace(/__NAME__/g, Malta.name)
			.replace(/__VERSION__/g, Malta.version)
			.replace(/__BUILDNUMBER__/g, self.buildnumber);

		baseTplContent = replace.calc(baseTplContent)

		// write function 
		// 
		function write(cnt, fname) {

			var name,
				nameMin,
				namePack;

			// !!!
			// 
			ext = self._utils.getFileExtension(self.outName.clear);

			// less
			// 
			if (ext.match(/less/)) {
				name = self.outName.clear.replace(/\.less$/, '.css');
				nameMin = self.outName.min.replace(/\.less$/, '.css');
				fname = name;
				ext = 'css';

				try {
					less.render(cnt, function(err, newcnt) {
						if (err) {
							console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
							notifyAndUnlock();
						} else {
							// update content to be written
							// 
							cnt = newcnt;
							do_write(name, nameMin);
						}
					});
				} catch (err) {
					console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
					notifyAndUnlock();
				}

			// sass
			//
			} else if (ext.match(/scss/)) {
				name = self.outName.clear.replace(/\.scss$/, '.css');
				nameMin = self.outName.min.replace(/\.scss$/, '.css');
				fname = name;
				ext = 'css';

				try {
					cnt = sass.render(cnt);
					do_write(name, nameMin);
				} catch (err) {
					console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
					notifyAndUnlock();
				}

			// .pdf.md
			//
			} else if (self.outName.clear.match(/\.pdf\.md$/)) {
				name = self.outName.clear.replace(/\.pdf\.md$/, '.pdf');
				nameMin = self.outName.min.replace(/\.pdf\.md$/, '.pdf');
				fname = name;
				ext = 'pdf';

				try {
					markdownpdf().from.string(cnt).to(name, function() {
						var d = self.date(),
							data = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

						msg = 'Build ' + self.buildnumber + ' @ ' + data + NL;
						msg += 'wrote ' + fname + ' (' + getSize(name) + ')' + NL;
						end = self.date();
						notifyAndUnlock();
					})
				} catch (err) {
					console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
					notifyAndUnlock();
				}


			// markdown
			//
			} else if (ext.match(/md/)) {
				name = self.outName.clear.replace(/\.md$/, '.md');
				nameMin = self.outName.clear.replace(/\.md$/, '.html');
				fname = name;
				ext = 'md';

				try {
					//cnt = markdown.toHTML( cnt );
					do_write(name, nameMin);
				} catch (err) {
					console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
					notifyAndUnlock();
				}


			// svg 
			//
			} else if (ext.match(/svg/)) {
				name = self.outName.clear.replace(/\.svg$/, '.svg');
				nameMin = self.outName.clear.replace(/\.svg$/, '.png');
				fname = name;
				ext = 'svg';

				try {
					//cnt = markdown.toHTML( cnt );
					do_write(name, nameMin);
				} catch (err) {
					console.log('[PARSE ERROR: ' + ext + '] ' + err.message + ' @' + err.line);
					notifyAndUnlock();
				}


			
			// All other files
			//
			} else {
				name = self.outName.clear;
				nameMin = self.outName.min;
				namePack = self.outName.pack;
				do_write(name, nameMin);
			}



			function do_write(name, nameMin) {

				fs.writeFile(name, cnt, function(err) {
					var d = self.date(),
						data = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(),
						minif,
						packed;

					msg = 'Build ' + self.buildnumber + ' @ ' + data + NL;
					msg += 'wrote ' + fname + ' (' + getSize(name) + ')' + NL;

					// if has js or css extension use uglification to get the minified version
					// 
					if (ext.match(/js|css/)) {

						function _writeJsFiles() {

							function writePacked() {
								packed = packer.pack(cnt, self.js_base62, self.js_shrink);
								fs.writeFile(namePack, packed, function(err) {
									if (err == null) {
										msg += 'wrote ' + namePack + ' (' + getSize(namePack) + ')' + (self.js_base62 ? ' base62' : '') + (self.js_shrink ? ' shrink' : '');
										msg +=  NL;
									} else {
										console.log('[ERROR] packer says:');
										console.dir(err);
										self._stop();
									}
									notifyAndUnlock();
								});
							}
							// console.log('outversion :', self.outVersion);
							/*
							mode 1 > only min
							mode 2 > only pack
							mode 3 > both
							*/
							try {
								if (self.outVersion !== 2) {
									minif = uglify_js.minify(name).code ;
									fs.writeFile(nameMin, minif, function(err) {
										if (err == null) {
											msg += 'wrote ' + nameMin + ' (' + getSize(nameMin) + ')' + NL;
										} else {
											console.log('[ERROR] uglify-js says:');
											console.dir(err);
											self._stop();
										}
										notifyAndUnlock();
										// now packer if js
										// 
										self.outVersion==3 && writePacked();
										
									});
								} else {
									// only pack
									writePacked();
								}

							} catch (e) {
								console.log('[PARSE ERROR: uglify] ' + e.message + ' @' + e.line + ' maybe on ' + self.lastEditedFile);
								console.log('[WARN: Minified version skipped]');
								notifyAndUnlock();
							}
						}

						function _writeCssFiles() {
							// even minified
							minif = uglify_css.processString(cnt, { maxLineLen: 500, expandVars: true });
							fs.writeFile(nameMin, minif, function(err) {
								if (err == null) {
									msg += 'wrote ' + nameMin + ' (' + getSize(nameMin) + ')' + NL;
								} else {
									console.log('[ERROR] uglify-css says:');
									console.dir(err);
									self._stop();
								}
								notifyAndUnlock();
							});
						}


						// if >0 need somethign more that plain one
						// 
						if (self.outVersion){
							(ext == 'js') ? _writeJsFiles() : _writeCssFiles();
						} else {
							notifyAndUnlock();
						}


					} else if (ext.match(/md/)) {
						try {

							cnt = markdown.toHTML(cnt);
							fs.writeFile(nameMin, cnt, function(err) {
								if (err == null) {
									msg += 'wrote ' + nameMin + ' (' + getSize(nameMin) + ')' + NL;
								} else {
									console.log('[ERROR] markdown says:');
									console.dir(err);
									self._stop();
								}
								notifyAndUnlock();
							});

						} catch (e) {
							console.log('[PARSE ERROR: markdown] ' + e.message + ' @' + e.line + ' maybe on ' + self.lastEditedFile);
							console.log('[WARN: Html version skipped]');
							notifyAndUnlock();
						}

					} else if (ext.match(/svg/)) {
						try {

							svg_to_png.convert(fname, self.outDir, {compress : true}) // async, returns promise 
							.then( function(){
								msg += 'wrote ' + nameMin + ' (' + getSize(nameMin) + ')' + NL;
								notifyAndUnlock();
							});

						} catch (e) {
							console.log('[PARSE ERROR: svg-to-png] ' + e.message + ' @' + e.line + ' maybe on ' + self.lastEditedFile);
							console.log('[WARN: Png version skipped]');
							notifyAndUnlock();
						}
					} else {

						end = self.date();
						notifyAndUnlock();

					}
				});
			}

		}

		// get size of file
		// 
		function getSize(path) {
			var byted = fs.statSync(path).size,
				kbyted = byted / 1024;
			return kbyted < 1 ? (byted.toFixed(2) + ' B') : (kbyted.toFixed(2) + ' KB');
		}

		// prints some informations just after build
		// 
		function notifyAndUnlock() {
			end = self.date();
			var tmp = 'watching ' + self.involvedFiles + " files";
			msg += 'in ' + (end - start) + 'ms' + NL;
			msg += (new Array(tmp.length + 1)).join('-') + NL;
			msg += tmp + NL;
			msg += (new Array(tmp.length + 1)).join('=') + NL;
			console.log(msg);
			msg = '';
			self.doBuild = false;
		}

		// do write
		// 


		// get a local copy for the original outname 
		// 
		var fname = self.outName.clear,
			fnamemin;

		write(baseTplContent, fname);

		// chain
		//
		return this;
	},


	_signBuildNumber: function() {
		var fname = this.baseDir + DS + this.tplName.replace(/\./, '') + '.buildNum';
		buildno = 0;
		if (!fs.existsSync(fname)) {
			fs.writeFileSync(fname, ++buildno);
		} else {
			buildno = parseInt(fs.readFileSync(fname), 10) + 1;
		}
		this.buildnumber = buildno;
		fs.writeFileSync(fname, buildno);
	},

	/**
	 * [_parse description]
	 * @param  {string} path the complete path of the file that has been modified,
	 *                  thus Malta look inside tha file to look for relevant updates
	 *                  and reflects that on the files register        
	 * @return {void}
	 */
	_parse: function(path) {
		var self = this;

		// update cached content and time for that file,
		// that at first cycle will be always the tpl, but
		// then will be any modified file
		// 
		self.files[path] = self._utils.createEntry(path);

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
							execRoot + f
							:
							self.baseDir + DS + f;

					if (f) {

						self.queue.push(fname);

						// check for circular inclusion
						// 
						self._checkInvolved();

						tmp = self._utils.createEntry(fname);

						if (tmp) {

							// store entry
							// 
							self.files[fname] = tmp;

							// recur to look for inner inclusions
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
	},

	/**
	 * Watch through files and trigger parse on each file modified
	 * if at least one file has been modified, lock the inner
	 * watch execution until build ends and fires build
	 * 
	 * 
	 * @return {[type]} [description]
	 */
	_watch: function() {
		var self = this,
			d;

		function watch() {



			// empty queue
			//
			self.queue = [];

			for (f in self.files) {

				// somwthing changed
				//
				if (self.files[f].time < self._utils.getFileTime(f)) {
					d = new Date;

					console.log('[MODIFIED @ ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ' + f.replace(self.baseDir + DS, ''));
					// renew entry
					// 
					self.files[f] = self._utils.createEntry(f);

					// active flag rebuild
					// 
					self.doBuild = true;

					// if it`s vars .json reload it
					// 
					if (f === self.varPath) {
						// update vars
						// 
						self.vars = self._utils.solveJson(JSON.parse(fs.readFileSync(self.varPath)));
						// self.vars = JSON.parse(fs.readFileSync(self.varPath));
					}

					self._parse(f);
				}
			}
			self.doBuild && self._build();
		}

		// every second, if nothing is building, watch files
		// 
		setInterval(function() {
			!self.doBuild && watch();
		}, watchInterval);

		// chain
		//
		return this;
	},

	_watchNew: function() {
		var self = this,
			d;

		for (file in self.files) {



			(function(f) {

				var done = false;

				fs.watch(f, function(event, filename) {

					if (done) return;
					done = true;

					console.log(event)
						// empty queue
						//
					self.queue = [];

					d = new Date;

					console.log('[MODIFIED @ ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ' + f.replace(self.baseDir + DS, ''));
					// renew entry
					// 
					self.files[filename] = self._utils.createEntry(filename);

					// if it`s vars .json reload it
					// 
					if (filename === self.varPath) {
						// update vars
						// 
						self.vars = self._utils.solveJson(JSON.parse(fs.readFileSync(self.varPath)));
						// self.vars = JSON.parse(fs.readFileSync(self.varPath));
					}

					self._parse(filename);

					self._build();

					setTimeout(function() {
						done = false;
					}, watchInterval);
				});


			})(file);


		}
		// chain
		//
		return this;
	},

	/**
	 * Starts parsing of base template
	 * starts watch and first build
	 * @return {[type]} [description]
	 */
	start: function() {
		var self = this;

		
		
		

		// if exists add vars.json to watched files
		// 
		self.varPath && (self.files[self.varPath] = self._utils.createEntry(self.varPath));
		self._parse(self.tplPath)
			._watch()
			._build();
	},


	_hasVars: function() {
		return this.vars !== {};
	},


	/**
	 * check cmd params
	 * @return {instance} Malta instance
	 */
	check: function(a) {
		var tmp,
			argTemplate,
			argOutDir, i, t;

		if (a.length < 2) {
			console.log(Malta.name + ' v.' + Malta.version);
			console.log(NL + 'Usage : malta [templatefile] [outdir]');
			console.log('   OR   malta [buildfile.json]' + NL);
			process.exit();
		}

		// template and outdir params
		// 
		argTemplate = a[0];
		argOutDir = a[1];


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

		tmp = path.extname(this.tplName)

		// outnames, given here by the name of the tpl (tplName)
		// if desired a name different from the tpl then
		// here instead of this.tplName should be used the parameter given
		// in this.outDir once checked his validity
		// 
		this.outName = {
			clear: (this.outDir + DS + this.tplName),
			min: (this.outDir + DS + this.tplName).replace(tmp, '.min' + tmp),
			pack: (this.outDir + DS + this.tplName).replace(tmp, '.pack' + tmp)
		};

		// check vars.json
		// by default search for vars.json in the same folder 
		// of the tpl but if differently specified by a[2]
		// Hint: even if it expected to be in that position
		// it must be prefixed by -vars=json_relative_to_exec_folder
		this.varPath = this.baseDir + DS + 'vars.json';

		
		for (var i=2, t=a.length; i<t; i++) {
			tmp = a[i].match(/^-vars\=(.*)$/);
			if (tmp) {
				this.varPath = execRoot + DS + tmp[1];
				continue;
			}

			tmp = a[i].match(/^-o\=(\d)$/);
			if (tmp && tmp[1]>=0 && tmp[1]<4){
				this.outVersion = ~~(tmp[1]);
				continue;
			}

			tmp = a[i].match(/^-base62=(true|false)$/);
			if (tmp && tmp.length > 1){
				this.js_base62 = !!(tmp[1]=='true');
				continue;
			}

			tmp = a[i].match(/^-shrink=(true|false)$/);
			if (tmp && tmp.length > 1){
				this.js_shrink = !!(tmp[1]=='true');
			}

		}


		// get the content
		if (fs.existsSync(this.varPath)) {
			try {
				// tmp = JSON.parse(fs.readFileSync(this.varPath));
				tmp = this._utils.solveJson(JSON.parse(fs.readFileSync(this.varPath)));


				this.vars = tmp;
			} catch (e) {
				this.vars = {};
			}
		} else {
			//console.log('[INFO] No ' + this.varPath + ' file found');
			this.varPath = false;
		}

		// params validated 
		// chain for run
		// 
		return this;
	},

	/**
	 * [_utils description]
	 * @type {Object}
	 */
	_utils: {
		createEntry: function(path) {
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
			return fname.split('.').pop();
		},

		getFileTime: function(path) {
			return fs.existsSync(path) && fs.statSync(path).mtime.getTime();
		},

		uniquearr: function(a) {
			var r = [],
				l = a.length,
				i = 0,
				j;
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
			// inline
			s = s.replace(/^[\s\t]*\/\/.*(?=[\n\r])/gm, '');

			// multiline
			// s = s.replace(/\/\*[^\*\/]*\*\//gm, '');

			return s;
		},

		// 
		//
		solveJson: function(obj) {
			var self = this,
				maxSub = 1E3,
				i = 0;

			return (function _(o) {
				var y, yy;
				for (var j in o) {
					switch (typeof o[j]) {
						case 'string':
							while (y = o[j].match(/\$([A-z0-9-_/.]+)\$/)) {
								/*
								if (yy = self.checkns(y[1], obj)) {
									o[j] = o[j].replace('$' + y[1] + '$', yy);
								} else {
									o[j] = o[j].replace('$' + y[1] + '$', "");
								}
								*/								
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
		}
	}

}

// start Malta
// -----------------------------

function outVersion() {
	var str = Malta.name + ' v.' + Malta.version,
		l = str.length + 4,
		top = "╔" + (new Array(l-1)).join("═") + "╗" + NL +
			//"║"	+ (new Array(l-1)).join(' ') + "║" + NL + 
			"║ " + str + " ║" + NL + 
			//"║"	+ (new Array(l-1)).join(' ') + "║" + NL + 
			"╚" + (new Array(l-1)).join("═") + "╝" + NL + NL;
	console.log(top);
}

if (args.length == 1) {

	
	outVersion();

	var runs = fs.existsSync(execRoot + '/' + args[0]) ? require(execRoot + '/' + args[0]) : {},
		run;
	for (run in runs) {

		//skip key which begins with !
		if (run.match(/^\!/)) continue;

		var ls = child_process.spawn('malta', [run].concat(runs[run].split(/\s/)).concat(['do_not_print_version']));

		ls.stdout.on('data', function(data) {
			console.log("" + data);
		});
		/*
		ls.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
		ls.on('close', function (code) {
			console.log('child process exited with code ' + code);
		});*/
		//new Malta().check([run, runs[run]]).start();
	}
} else {
	if (args.indexOf('do_not_print_version') < 0) {
		outVersion();
	}
	new Malta().check(args).start();
}
// -----------------------------
