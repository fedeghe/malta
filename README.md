
       ╔═════╗
    ╔══╩══╦══╩══╗  MALTA
    ╚══╦══╩══╦══╝  v.  3
       ╚═════╝

# Malta is ...
a super-simple & handy tool which allows to build on the fly big files editing its separated parts and assembling in one following a main template file. In every involved file you can use variables coming from a json file, or use a value obtained evaluating an expression that involves those variables. Once started every change will trigger the right fresh build.


### ... plugin based   
Everytime _malta_ builds the main file it is possible to start a chain of actions where each action is done by a plugin. The shipped plugins allows for example to transpil es6, coffeescript and typescript, to compile _.less_, _.sass_, _.pug_, _.md_, to get a _.png_ from an _.svg_ and a lot more. 


---

### Get started  
- [installation](#installation)
- [command line](#commandline)
- [programmatic](#programmatic)
- [parameters](#parameters)
- [complete example of usage][2]
- [plugins list][3]
- [changelog][4]

---

<a name="installation"></a>
### Installation

If You do not have node installed yet, run:

    $ curl http://npmjs.org/install.sh | sh 

then install malta running:

    $ [sudo] npm install malta [-g]


---

<a name="commandline"></a>
### Command line Usage

_Malta_ can be started from the shell console just passing the right parameters to the malta executable: 

    $ malta templateFile outDirectory -plugins=... -vars=... -options=...

or

    $ malta conf.json
---

<a name="programmatic"></a>
### Programmatic

To use _malta_ within a javascript file just require it, _get_ a instance, pass a suitable array of parameters to the _check_ function and invoke _start_.

    var Malta = require('malta');
    Malta.get().check(['templateFile', 'outDirectory', '-plugins=...', '-vars=...', '-options=...']).start(/**
        here You can specify a function which will be called at every build with the Malta instance as context and will receive an object containing the current file _name_ and _content_
        eg:
         function (o) {
            console.log('Instance : ', this);
            console.log('File name: ' + o.name);
            console.log('File content: ' + o.content);
         }
    */);


---

### Single mode

The purpose of `single-mode` is just to build one file and in this case there are two mandatory parameters: _templateFile_ and _outDirectory_

    $ malta templateFile outDirectory  [-plugins=...] [-vars=...] [-options=...]

in programmatic this correspond to pass a corresponding array to the _check_ function :

    var Malta = require('malta');
    Malta.get().check(['templatefile', 'outDirectory']).start();

---

### Multi mode

The _multi-mode_ purpose is to launch Malta on more that one build in one command. In this case it take just one parameter that is the path to a json file which contains for each file the same informations. It uses as key the templateFile path and as value all other parameters space separated. E.g.:

multifile.json:  

    {  
        "palette.less" : "../../public_html/css -vars=./vars/deploy.json",  
        "common.less" : "../../public_html/css -plugins=malta-less(compress:false) -options=skipPlain=true",  
        "common.js" : "../../public_html/js -plugins=malta-js-uglify",  
        "lib.js" : "../../public_html/js -plugins=malta-js-uglify",  
        "controllers/*.js" : "app/controllers/  -plugins=malta-js-uglify"
        ...  
    }  

then run 

    $ malta multifile.json

_multi-mode_ is not available within a script, then the following code **will not work**:

    ...
    Malta.get().check(['multifile.json']).start();

moreover since 3.0.16 a simpla kind of wildcards can be used in the json keys : 

    {
        "src/controllers/*.js" : "../../public_html/js -plugins=malta-js-uglify"
    }

once started, Malta will start/stop on new files that could be added/removed to/from the `controllers` folder. 

---

<a name="parameters"></a>
# Parameters

Starting it as command line tool or programmatically the arguments are the same

    $ malta templateFile outDirectory [-vars=non_default_vars_path] [-options=options] [-require|plugins=name1(options)[...name2(options)[...]]]
        

- **templateFile**  
is the base template used as base file.  
  
- **outDirectory**  
is the folder where the output files will be written in.

- **-vars=_non/default/myvars.json_**  
here is possible to tell Malta to consider a different file for variables (default would be searched as _templateFolded_/vars.json); if used the path specified must be relative to the execution folder.


- **-options=_key1:value1,..._**  
here the following key:values are considered:
    - *showPath*: *boolean* (default : true)  
         Malta for certain files will prepend the file inclusion with a small comment which will be really helpful when looking in the resulting file one wants to know from which file a particular section comes from. Significant only in xml, svg, js, css, less, scss files.
    - *watchInterval* : *integer* (default 1000)  
        This is the interval in milliseconds between every check for a modification in one of the involved files
    - *verbose* : *integer* (default : 1)  
        0 no console messages
        1 default messages
        2 verbose messages
        

- **-plugins=**  
_Malta_ is shipped with a number of plugins to do as post-processing job every special task that was done before like compiling less files, packing js, etc... 
To use one plugin a `-require` or `-plugins` argument must be specified when invoking _malta_ and if the plugin allows it, some parameters can be passed to it. On the same file more than one plugin can act serially:  a 3dot separated list of elements, one for each plugin with the following structure: `plugin-name(key:value,...)` will ensure each plugin start only when the previous one has finished his job and it will receive the right filename and content.
Whenever some parameters are needed to be passed to the plugin, i9n case of string value, then You need to pass the string just wrap it into escaped double quotes \".  


### something more about plugins 

The version 3 of _malta_ aims to simplify any post-processing needed to be done on the composed file. In fact now _malta_ just do the job of creating the big file from the template and all files and variables involved... nothing else, no packing for js, no less/sass compiling, only the clean plain big file.
Whatever work is needed afterwards it needs to be done by a plugin.   
When a plugin `myplugin` is requested the first place malta will search for it is `executionfolder/plugins/myplugin.js` if not found will be searched as `plugins/myplugin.js` into the local malta package path, otherwise will be searched as a local/global package.
---

### Placeholders  

Malta uses three kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the templateFile directory; if starts with / then will be relative to the execution folder

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

- **!{expression}!**
  _expression_ can contain anything that must be evaluated (eval is used)
 

---

### Write Your plugin in one minute  
Writing a plugin is extremely easy, just get a look at the _sample.js_ file in the _plugins_ folder or read [how to create a plugin][5]

---

# Hints

- **absolutely** use only spaces and/or tabs before and after file placeholders
 
- one line files (like already minified ones) **really** slow down the parsing, so the best thing is to avoid the inclusion of minified/packed files.

- to avoid loops Malta stops digging at the tenth nesting level.


# Wired vars

There are some placeholders that can be used within any involved file:  

- \_\_TIME\_\_ : the HH : MM : SS build time
- \_\_DATE\_\_ : the D / M / YYYY build date   
- \_\_YEAR\_\_ : the YYYY format build year  
- \_\_FILESNUM\_\_ : the number of files glued togheter  
- \_\_VERSION\_\_ : Malta version
- \_\_BUILDNUMBER\_\_ : build number





--------

[0]: https://www.npmjs.org
[1]: plugins/sample.js
[2]: https://github.com/fedeghe/malta/blob/master/docs/sample.md
[3]: https://github.com/fedeghe/malta/blob/master/docs/plugin-list.md
[4]: https://github.com/fedeghe/malta/blob/master/docs/changelog.md
[5]: https://github.com/fedeghe/malta/blob/master/docs/create-a-plugin.md
