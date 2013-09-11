#!/usr/bin/env node
//
var fs = require("fs"),
    uglify = require("uglify-js"),

    //path from where Malta is started
    execRoot = process.cwd();

    // commandline arguments array
    args = process.argv.splice(2),

    packageInfo = fs.existsSync('./package.json') ? require('./package.json') : {};


//main object
function Malta() {}

Malta.prototype = {
    name : 'name' in packageInfo ? packageInfo.name : 'Malta',
    version : 'version' in packageInfo ? packageInfo.version : 'undefined',
    vars : {},
    tplName : '',
    baseDir : '',
    tplDir : '',
    tplCnt : '',
    outDir : '',
    outName : {"clear":"", "min":""},
    varFile : '',
    lastEditedFile : false,
    update : true,
    updateTime : 0,
    
    check : function (a) {
        var tmp;
        if (a.length < 2) {
            console.log("\nUsage : malta [templatefile] [outdir]");
            console.log("\n")
            process.exit();
        }
        
        tmp = args[0].split('/');
        this.tplName = tmp.pop();
        this.baseDir = execRoot + '/' + tmp.join('/');
        
        if (!fs.existsSync(this.baseDir + '/' + this.tplName)) {
            console.log('Template `' + this.baseDir + '/' + this.tplName + '` NOT FOUND!');
            process.exit();	
        }
        
        this.tplCnt = fs.readFileSync(this.baseDir + '/' + this.tplName).toString();

        this.outDir = execRoot + '/' + args[1].replace(/\/$/, '');
        if (!fs.existsSync(this.outDir)) {
            console.log('OutDir `' + this.outDir + '` NOT FOUND!');
            process.exit();	
        }
        this.outName.clear = this.outDir + '/' +  this.tplName.replace('.tpl', '.js');
        this.outName.min = this.outName.clear.replace('.js', '.min.js');        
        
        //console.log("[DEBUG]outDir OK");
        
        //check vars.json
        this.varFile = this.baseDir + '/vars.json';
        if (fs.existsSync(this.varFile)) {
            try {
                this.vars = JSON.parse(fs.readFileSync(this.varFile));
            } catch (e){
                this.vars = {};
            }
        }else{
            console.log('No config file found ' +  this.varFile);
        }
        return this;
    },
    
    run : function () {
        var self = this,
            level = 10,
            reg = {
                files : new RegExp('(.*)\\\$\\\$([A-z0-9-_/.]*)\\\$\\\$', 'g'),
                vars : new RegExp('\\\$([A-z0-9-_/.]*)\\\$', 'g')
            },
            date = function () { return new Date(); },
            replace = {
                all : function (tpl) {
                    var str;
                    return tpl.replace(reg.files, function (str, $1, $2) {
                        var tmp = (fs.existsSync(self.baseDir + '/' + $2)) ? fs.readFileSync(self.baseDir + '/' + $2) : false;
                        if (!tmp) {
                            console.log('[ERROR]: file ' +  self.baseDir + ' / ' + $2 + ' NOT FOUND');
                            return $2;
                        } else {
                            //		console.log("\t" + $2);
                        } 
                        if (checkTimes(self.baseDir + '/' + $2)) {
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
                self.tplCnt = fs.readFileSync(self.baseDir + '/' + self.tplName).toString();
                try{
                    self.vars = fs.existsSync(self.varFile) ? JSON.parse(fs.readFileSync(self.varFile)) : {};
                }catch(e){
                    console.log('[ERROR] parsing ' + varFile);
                    self.vars = {};
                }

                // update template?
                checkTimes(self.baseDir + '/' + self.tplName)
                ||
                //checkTimes(self.outName.clear)||
                checkTimes(self.varFile);
                
                
                while (level-- && self.tplCnt.match(reg.files)) {
                    self.tplCnt = replace.all(self.tplCnt);
                }

                //check for loops or too much digging
                !level && console.log('[ERROR] maximum nesting level reached!');
                
                self.tplCnt = replace.vars(self.tplCnt)
                    .replace(/__TIME__/g, date().getHours() + ':' + date().getMinutes() + ':' + date().getSeconds())
                    .replace(/__DATE__/g, date().getDate() + '/' + (date().getMonth() + 1) + '/' + date().getFullYear())
                    .replace(/__YEAR__/g, date().getFullYear());
                
                // update ?
                self.update && fs.writeFile(self.outName.clear, self.tplCnt, function(err) {
                    var d = date(),
                        data = d.getHours() + ':' + d.getMinutes()  + ':' + d.getSeconds(),
                        msg = '[' + data + '] created ' + self.outName.clear;

                    if (self.outName.clear.split('.').pop() === 'js') {
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
                level = 10;
            };
            
        setInterval(function () {build(); }, 1000);
        console.log(self.name + "@" + self.version + " running");
    }
};

// start
(new Malta()).check(args).run();



