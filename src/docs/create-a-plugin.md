## Plugin promise chain

Whenever `malta` is started the first job of getting the template content, solve the includes and replace variables is done just by `malta`, no plugin is required.  
A plugin is structured basically as follows:  

``` js
/**
 * load dependencies and whatever needed
 */
const dep = require('lib'),
    path = require('path'),
    fs = require('fs');

/**
 * obj = {
 *  name: the name of the input file (maybe fromt he previous plugin)
 *  content: the content of the input file ( same as above )
 * }
 */ 
function myplugin(obj, options) {
    
    /**
     * The context of the call is the malta instance,
     * (that also means you cannot use an arrow func here)
     * so from here you can get all information about
     * the original template path, all plugins involved
     * all options, the output folder, an on..
     * @type Object
     */
    const self = this,
        /**
         * just to show some stats on the console
         * about the time required by the plugin
         */
        start = new Date(),
        pluginName = path.basename(path.dirname(__filename));
    /**
     * a message the plugin can send to the console
     */
    let msg;

    options = options || {};
    
    /**
     * Maybe the file name must be changed, this is the full path,
     * if the function you want to call is asynchronous just call
     * it inside the returning function
     */
    obj.name = obj.name.replace(/\.js$/, '.commented.js');
    
    /**
     * the next plugin will be invoked with an updated obj
     * only when the solve function is called passing the updated obj
     */
    return (solve, reject) => {
        /**
         * free to be async
         * transform the obj.content
         */
        dep.do_your_job(obj.content, options).then(content => {

            fs.writeFile(obj.name, obj.content, err => {
                if (err == null) {
                    msg = 'plugin ' + pluginName.white() + ' wrote ' + obj.name +' (' + self.getSize(obj.name) + ')';
                } else {
                    console.log('[ERROR] '.red() + pluginName + ' says:');
                    console.dir(err);

                    /**
                     * something wrong, stop malta
                     */
                    self.stop();
                }
                
                /**
                 * allright, solve, notify and let malta proceed
                 */
                solve(obj);
                self.notifyAndUnlock(start, msg);
            });

        });
    }
}
/**
 * if the plugin shall be used only on some special file types
 * declare it (it can be an array too)  
 * if not specified the plugin will be called on any file
 */
myplugin.ext = 'js';
module.exports = myplugin;
```  

## Listen to me    
One of the cool things about `malta` is the watching for changes feature: it runs as a console demon and whenever a relevant change occours, it builds the right file again. If Your plugin involves a file passed as parameter that you would like to be involved in this watching process just use the `listen` function:  

``` js
self.listen(theFilePath) //relative to execution folder
```

## Create a private local plugin  

Whenever a plugin is required through the `-require` (or `-plugins`) parameter, the first place `malta` will search for the file is in a `plugins` folder in the execution path (the folder from where you invoke `malta`).  
So, if you want to write a private local plugin, just create a `plugins` folder
and save for example a `myplugin.js` file containing the code of Your plugin, then just use it like a normal plugin:  

``` js
malta template.js out/folder -require=myplugin[from:1,to:10]
```
