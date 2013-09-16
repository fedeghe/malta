#!/usr/bin/env node
/**
 *  Malta
 */
var fs = require("fs"),
    path = require("path"),
    uglify = require("uglify-js"),

    //path from where Malta is started
    execRoot = process.cwd();

    // commandline arguments array
    args = process.argv.splice(2),

    // get package info
    packageInfo = fs.existsSync(__dirname + '/package.json') ? require(__dirname + '/package.json') : {},

    //directory separator
    DS = '/';

//main object
function Malta() {}

Malta.prototype = {

    // Malta will dig for placeholder until the tenth level, that protect even from loops
    MAX_NESTING : 10,
    
    //get package name and version
    name : 'name' in packageInfo ? packageInfo.name : 'Malta',
    version : 'version' in packageInfo ? packageInfo.version : 'undefined',

    //var register from vars.json or {}
    vars : {},
    varPath : '',

    tplName : '',
    tplPath : '',
    tplCnt : '',

    baseDir : '',
    
    outDir : '',
    outName : {},
    

    lastEditedFile : false,
    update : true,
    updateTime : 0,

    /**
     * Checks parameters value
     * @param  [Array] a parameters 
     * @return chain
     */
    check : function (a) {
        var tmp,
            argTemplate,
            argOutDir;
        if (a.length < 2) {
            console.log("\nUsage : malta [templatefile] [outdir]");
            console.log("\n")
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
            "min" : this.outName.clear.replace(tmp, '.min' + tmp)
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
            console.log('[INFO] No config file found ' +  this.varPath);
        }
        

        // params validated 
        //chain for run
        return this;
    },
    
    run : function () {
        var self = this,

            //recover nesting level
            level = self.MAX_NESTING,

            //regexp for files and vars
            reg = {
                files : new RegExp('(.*)\\\$\\\$([A-z0-9-_/.]*)\\\$\\\$', 'g'),
                vars : new RegExp('\\\$([A-z0-9-_/.]*)\\\$', 'g')
            },

            //date factory
            date = function () { return new Date(); },

            //replacers functions
            replace = {
                all : function (tpl) {
                    var str;
                    return tpl.replace(reg.files, function (str, $1, $2) {
                        var tmp = (fs.existsSync(self.baseDir + DS + $2)) ? fs.readFileSync(self.baseDir + DS + $2) : false;
                        if (!tmp) {
                            console.log('[ERROR]: file ' +  self.baseDir + DS + $2 + ' NOT FOUND');
                            return $2;
                        } 
                        if (checkTimes(self.baseDir + DS + $2)) {
                            self.update = true;
                        }
                        return $1 + tmp.toString().replace(/\n/g, "\n" + $1);// give back spaces to CODE
                    });
                },
                vars : function (tpl) {
                    var str;
                    return tpl.replace(reg.vars, function (str, $1) {
                        if($1 in self.vars) {
                            return self.vars[$1];
                        } else {
                            return $1;
                        }
                    });
                }
            },


            checkTimes  = function (f1) {
                var res = fs.existsSync(f1) && fs.statSync(f1).mtime.getTime() > self.updateTime ;
                res && (self.lastEditedFile = f1);
                res && (self.update = true);
                return res;
            },
            
            
            build = function () {
                
                //get time of target or no target found
                self.updateTime = fs.existsSync(self.outName.clear) ? fs.statSync(self.outName.clear).mtime.getTime() : 0;
                self.tplCnt = fs.readFileSync(self.baseDir + DS + self.tplName).toString();
                try{
                    self.vars = fs.existsSync(self.varPath) ? JSON.parse(fs.readFileSync(self.varPath)) : {};
                }catch(e){
                    console.log('[ERROR] parsing ' + self.varPath);
                    self.vars = {};
                }

                // update template?
                checkTimes(self.baseDir + DS + self.tplName)
                ||
                //checkTimes(self.outName.clear)||
                checkTimes(self.varPath);
                    
                while (level-- && self.tplCnt.match(reg.files)) {
                    self.tplCnt = replace.all(self.tplCnt);
                }


                if (self.update) {
                    //check for loops or too much digging
                    !level && console.log('[ERROR] maximum nesting level reached!');
                    

                    //
                    self.tplCnt = replace.vars(self.tplCnt)
                        .replace(/__TIME__/g, date().getHours() + ':' + date().getMinutes() + ':' + date().getSeconds())
                        .replace(/__DATE__/g, date().getDate() + '/' + (date().getMonth() + 1) + '/' + date().getFullYear())
                        .replace(/__YEAR__/g, date().getFullYear());
                    
                    // update ?
                    fs.writeFile(self.outName.clear, self.tplCnt, function(err) {
                        var d = date(),
                            data = d.getHours() + ':' + d.getMinutes()  + ':' + d.getSeconds(),
                            msg = '[' + data + '] created ' + self.outName.clear;

                        // if has js extension use uglify-js to get even the minified version
                        if (self.outName.clear.match(/\.js$/)) {
                            try {
                                fs.writeFile(self.outName.min, uglify.minify(self.outName.clear).code, function(err) {
                                    if (!err) {
                                        msg += " and " + self.outName.min;
                                    }
                                    console.log(msg);	
                                });
                            } catch(e) {
                                console.log('[PARSE ERROR: uglify] ' + e.message + ' @' + e.line + ' maybe on ' + self.lastEditedFile);
                            }
                        } else {
                            console.log(msg);
                        }
                    });
                    
                    //reset update flag
                    self.update = false;
                    
                    //recover nesting level
                    level = self.MAX_NESTING;
                }
            };
        
        //call build every second
        setInterval(function () {build(); }, 1000);

        // Malta has started
        console.log(self.name + "@" + self.version + " running");
    }
};

// Start Malta
(new Malta()).check(args).run();



