## Plugin promise chain

Whenever `malta` is started the first job of getting the template content, solve the includes and replace variables is done just by `malta`, no plugin is required.  
A plugin is structured basically as follows:  

    //load dependencies and whatever needed
    var dep = require('lib'),
        path = require('path')
        fs = require('fs');
    
    function myplugin(obj, options) {
        
        /**
         * The context of the call is the malta instance,
         * so from here you can get all information about
         * the original template path, all plugins involved
         * all options, the output folder, an on..
         * @type Object
         */
        var self = this,
            
            // just to show some stats on the console
            // about the time required by the plugin
            start = new Date(),
            
            // a message the plugin can send to the console
            msg;
    
        options = options || {};
        
        /**
         * The plugin can do his job on the current content (maybe modified by
         * the previous plugin) using o.content  
         */
        obj.content = dep.do_your_job(obj.content, options);
        
        /**
         * Maybe the file name must be changed, this is the full path,
         * if the function you want to call is asynchronous just call
         * it inside the returning function
         */
        obj.name = obj.name.replace(/\.js$/, '.commented.js');
        
        // the next plugin will be invoked with an updated obj
        // only when the solve function is called passing the updated obj
        return function (solve, reject) {
            // free to be async
            fs.writeFile(obj.name, obj.content, function (err) {
                if (err == null) {
                    msg = 'plugin ' + path.basename(__filename) + ' wrote ' + obj.name + ' (' + self.getSize(obj.name) + ')';
                } else {
                    console.log('[ERROR] myplugin says:');
                    console.dir(err);
    
                    // something wrong, stop malta
                    self.stop();
                }
                
                // allright, solve, notify and let malta proceed
                solve(obj);
                self.notifyAndUnlock(start, msg);
            })
        }
    }
    /**
     * if the plugin shall be used only on some special file types
     * declare it (it can be an array too)  
     * if not specified the plugin will be called on any file
     */
    myplugin.ext = 'js';
    
    // export
    module.exports = myplugin;

## Listen to me    
One of the cool things about `malta` is the watching for changes feature: it runs as a console demon and whenever a relevant change occours, it builds the right file again. If Your plugin involves a file passed as parameter that you would like to be involved in this watching process just use the `listen` function:  

    self.listen(theFilePath) //relative to execution folder

## Create a private local plugin  

Whenever a plugin is required through the `-require` (or `-plugins`) parameter, the first place `malta` will search for the file is in a `plugins` folder in the execution path (the folder from where you invoke `malta`).  
So, if you want to write a private local plugin, just create a `plugins` folder
and save for example a `myplugin.js` file containing the code of Your plugin, then just use it like a normal plugin:  

    malta template.js out/folder -require=myplugin[from:1,to:10]

