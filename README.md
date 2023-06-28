[![npm version](https://badge.fury.io/js/malta.svg)](http://badge.fury.io/js/malta)
[![npm downloads](https://img.shields.io/npm/dm/malta.svg)](https://npmjs.org/package/malta)
[![Package Quality](https://npm.packagequality.com/shield/malta.svg)](https://packagequality.com/#?package=malta)

[![Coverage Status](https://coveralls.io/repos/github/fedeghe/malta/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/malta?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/fedeghe/malta/badge.svg)](https://snyk.io/test/github/fedeghe/malta)
 [![changelog](https://img.shields.io/badge/changelog-md-blue.svg?style=flat-square)][4]

![malta logo](https://raw.githubusercontent.com/fedeghe/malta/master/src/media/malta.png) **v.4**

# Malta is ...  
a super-simple & handy tool which allows to build on the fly big files editing its separated parts and assembling in one following a main template file. In every involved file you can use variables coming from a json file, or use a value obtained evaluating an expression that involves those variables. Once started every change will trigger the right fresh build.

### ... plugin based   

Everytime _malta_ builds the main file it is possible to start a chain of actions where each action is done by a plugin. The shipped plugins allows for example to transpil es6, coffeescript and typescript, to compile _.less_, _.sass_, _.pug_, _.md_, to get a _.png_ from an _.svg_ and a lot more. 

---

### Get started  

- [installation](#installation)
- [command line](#commandline)
- [programmatic](#programmatic)
- [single mode](#single_mode)
- [multi mode](#multi_mode)
- [multi destinations](#multi_destinations)
- [parameters](#parameters)
- [complete example of usage][2]
- [microtemplating](#microtemplating)
- [placeholders](#placeholders)
- [something more about placeholders](#smplaceholders)
- [plugins list][3]
- [something more about plugins](#smplugins)
- [write your plugin in 5 minutes](#writeyourplugin)
- [changelog][4]

---

<a name="installation"></a>

### Installation  

If You do not have node installed yet, run:

``` shell  
$ curl http://npmjs.org/install.sh | sh 
```

then install malta running:

``` shell  
$ [sudo] npm install malta [-g]
```

---

<a name="commandline"></a>

### Command line Usage  

_Malta_ can be started from the shell console just passing the right parameters to the malta executable: 

``` shell  
$ malta templateFile outDirectory -plugins=... -vars=... -options=...
```
or
``` shell  
$ malta conf.json
```
---

<a name="programmatic"></a>

### Programmatic  

To use _malta_ within a javascript file just require it, _get_ a instance, pass a suitable array of parameters to the _check_ function and invoke _start_.

``` js  
var Malta = require("malta");
Malta.get().check([
    "templateFile", "outDirectory",
    "-plugins=...", "-vars=...", "-options=..."
]).start(/**
    here You can specify a function which will be called at every build step, with the Malta instance as context and will receive an object containing the current file _name_ and _content_
    eg:
     function (o) {
        console.log('Instance : ', this);
        console.log('File name: ' + o.name);
        console.log('File content: ' + o.content);
     }
*/);
```

Since version __3.3.3__ the start function returns a _thenable_, so is possible to pass a function through a `then` call; it will be executed as far as _all_ involved plugins have terminated their job:

``` js  
Malta_CheckedParams_Instance
.start(/*
    everybuild code, each plugin end, even first plain build
*/)
.then(function (){
    /*
    this code will be executed when ALL plugin terminated the job;
    even in this function the context is the Malta instance running
    */
});
```
---

<a name="single_mode"></a>

### Single mode  

The purpose of `single-mode` is just to build one file and in this case there are two mandatory parameters: _templateFile_ and _outDirectory_

``` shell
$ malta templateFile outDirectory  [-plugins=...] [-vars=...] [-options=...]
```
in programmatic this correspond to pass a corresponding array to the _check_ function :

``` js  
var Malta = require("malta");
Malta.get().check(["templatefile", "outDirectory"]).start();
```
---

<a name="multi_mode"></a>

### Multi mode  

The _multi-mode_ purpose is to launch Malta on more that one build in one command. In this case it takes just one parameter that is the path to a json file which contains for each file the same informations. It uses as key the templateFile path and as value all other parameters space separated. E.g.:

multifile.json:  

``` json  
{  
    "palette.less" : "../../public_html/css -vars=./vars/deploy.json",  
    "common.less" : "../../public_html/css -plugins=malta-less[compress:false] -options=skipPlain=true", 
    "controllers/*.js" : "app/controllers/  -plugins=malta-js-uglify",
    "nested.json" : true 
}  
```

`nested.json` is allowed ONLY since v 3.2.4 (malta will not take care about reference loops)
where nested.json :  

``` json  
{
    "common.js" : "../../public_html/js -plugins=malta-js-uglify",  
    "lib.js" : "../../public_html/js -plugins=malta-js-uglify"
}
```
then run 

``` shell  
$ malta multifile.json
```
_multi-mode_ is not available within a script, then the following code **will not work**:

``` js  
// ...
Malta.get().check(["multifile.json"]).start();
```
moreover since 3.0.16 a simple kind of wildcards can be used in the json keys : 

``` json  
{
    "src/controllers/*.js" : "../../public_html/js -plugins=malta-js-uglify"
}
```
once started, Malta will start/stop on new files that could be added/removed to/from the `controllers` folder.  

---

<a name="multi_destinations"></a>

### More destinations for one file. 
Since version 3.7.2.0 it is possible to write more files starting from the same template just specifying an array of destinations:  

``` json  
{
    "src/mybook.md" : [
        "dist/uk -plugins=malta-translate[input:\"en\",output:\"it\"]...malta-markdown-pdf -vars=vars_it.json",
        "dist/de -plugins=malta-translate[input:\"en\",output:\"de\"]...malta-markdown-pdf -vars=vars_de.json"
    ]
}
```
This will produce two different pdf files automatically translated (standing the right placeholder are used passing short English sentences) using the same template and allowing to use different variables on each of them.

---

<a name="parameters"></a>

### Parameters  

Starting it as command line tool or programmatically the arguments are the same
```
$ malta templateFile outDirectory [-vars=non_default_vars_path] [-options=options] [-require|plugins=name1(options)[...name2(options)[...]]]
```

- **templateFile**  
is the base template used as base file.  
  
- **outDirectory**  
is the folder where the output files will be written in.

- **-vars=_non/default/myvars.json_**  
here is possible to tell Malta to consider a different file for variables (default would be searched as _templateFolder_/vars.json); if used the path specified must be relative to the execution folder.


- **-options=_key1:value1,..._**  
here the following key:values are considered:
    - *showPath*: *boolean* (default : true)  
         Malta for certain files will prepend the file inclusion with a small comment which will be really helpful when looking in the resulting file one wants to know from which file a particular section comes from. Significant only in xml, svg, js, css, less, scss files.
    - *watchInterval* : *integer* (default 1000)  
        This is the interval in milliseconds between every check for a modification in one of the involved files.  
    - *verbose* : *integer* (default : 1)  
        0 no console messages
        1 default messages
        2 verbose messages
    - *notifyBuild*: *boolean* (deafult : true)  
        Only on MacOS. Use _osascript_ to show a sticky message at each build (verbose has to be > 0).
    - *justCopy*: *boolean* (default : false) [from v.3.9.11]  
        in case it is simply needed to skip the placeholders replacement, the file is simply copied (but still plugin processes if any)
    - *placeholderMode*: 'dolla' or 'func' (default 'dolla')  
        'func' is used to allow to use the new placeholders [**maltaV**, **maltaF**, **maltaE**] introduced in version **4.0.0**
        

- **-plugins=**  
_Malta_ is shipped with a number of plugins to do as post-processing job every special task that was done before like compiling less files, packing js, etc... 
To use one plugin a `-require` or `-plugins` argument must be specified when invoking _malta_ and if the plugin allows it, some parameters can be passed to it. On the same file more than one plugin can act serially:  a 3dot separated list of elements, one for each plugin with the following structure: `plugin-name(key:value,...)` will ensure each plugin start only when the previous one has finished his job and it will receive the right filename and content.
Whenever some parameters are needed to be passed to the plugin, in case of string value, then You need to pass the string just wrap it into escaped double quotes \".  

<a name="smplugins"></a>

### Something more about plugins  

The version 3 of _malta_ aims to simplify any post-processing needed to be done on the composed file. In fact now _malta_ just do the job of creating the big file from the template and all files and variables involved... nothing else, no packing for js, no less/sass compiling, only the clean plain big file.
Whatever work is needed afterwards it needs to be done by a plugin. 
When a plugin `myplugin` is requested the first place malta will search for it is `executionfolder/plugins/myplugin.js` then in `executionfolder/plugins/myplugin/index.js` then `plugins/myplugin.js` into the local malta package path, otherwise will be searched as a local/global package.  

##### no demon (only _multi-mode_)  

In case the process must end after the first build just prefix with #
the template (only in _multi-mode_). Can be used as well in the nested.json avoiding to watch all files committed to be built by the nested json content.

##### execute a terminal command (only _multi-mode_)  

Is possible to execute one or more commands using the `EXE` key in the json file, containing an array of command or a single string for one command :  

``` json  
{
    "EXE" : [
        "mkdir -p app/config app/controllers app/views app/routes",
        "ls -la app"
    ],
    "all other" : "stuff"
} 
```

Before version 3.7.2 this feature is available only on the main called json, not in a nested one.  
Since version 3.7.2 it is possible to specify a EXE section in any nested json.  
  
For example:  

``` json  
{
    "EXE" : [
        "rm -rf dist",
        "mkdir dist"
    ],
    "dist/require.json" : true
}
```
then **_dist/require.json_** can contain something like:  

``` json  
{
    "EXE" : [
        "mkdir dist/js"
    ],
    "src/tpl/main.js" : "dist/js"
}
```

Another feature introduced since 3.7.2 is the possibility to specify more than one destination directory.

---

<a name="microtemplating"></a>  

### Microtemplating (experimental)   

Starting from the version `3.5.3` a simple microtemplating functionality is builtin; within the template just use the `<malta%` and `%malta>` placeholders to set your logic on the template composition (or any involved file):

``` js  
... all your awesome code here
<malta% if($my.config.bool$) { %malta>
    ...
    $$fileA.js$$
    ...
<malta% } else { %malta>
    ...
    $$fileB.js$$
    ...
<malta% } %malta>
```
now the Malta rebuild will include the right file depending on the `my.config.bool` value found on the vars json.

---

<a name="placeholders"></a> 

### Placeholders  

Malta uses three kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **\$\$filePath\$\$**  
  _filepath_ is the path to the desired file relative to the templateFile directory; if starts with / then will be relative to the execution folder.  
  
- **\$varPath$\**  
  _varPath_ is the key path for a variable that Malta will search in a _vars.json_ file that should be found in the template folder (or wherever the -vars options indicates)  

- **\$PACKAGE.varpath\$**  
    Starting from _v.3.9.0_ it is possible to use another placeholder to use anywhere all values contained in the `package.json` found in the folder where malta has been lanuched.  For example assume in the `root` folder we have a `package.json` and we would like to use the `version` and the `repository.url` within our source. Will be enough to add a special placeholder that contains the path of the value inside the `package.json` prepended with a `PACKAGE.` as follows:

    ``` js  
    $PACKAGE.name$ 
    // or
    $PACKAGE.repository.url$
    ```

- **!{expression}!**
  _expression_ can contain anything that must be evaluated (`eval` function is used)  

**Starting from version 4.0.0** also the following alternative placeholders are available (passing `placeholderMode:'func'` in the _options_):  
- **maltaF('filepath'[, {'passed':2, 'vars': 'hello'}])**  // keys must be quoted
- **maltaV('varPath'[, fallbackValue])**  
- **maltaE(expression)**  
hint about the _maltaE_: it should not contain ( and ) otherwise will fail, the only allowed parenthesis are those one from _maltaV(...)_, which can still be part of the _expression_:  

``` js  
// OK
var foo = maltaE(maltaV('my.number.var.is.a.bit.deep') + 5),
    boo = maltaE(Math.pow(2,3) * maltaV(my.num) + 3)

// ERROR
var boo = maltaE(Math.pow(maltaV(my.num), 2) + 3)
```

--- 

<a name="smplaceholders"></a> 

### Something more about placeholders

The `$$filePath$$` placeholder can optionally accept simple parameters:  

`$$triangles.svg{cx:100,cy:100,s:30,rot:30}$$`

now within the `triangle.svg` we can use those vars:  

``` html  
<polygon
    points="0,!{-$s$}! !{$s$*Math.cos(Math.PI/6)}!,!{$s$*Math.sin(Math.PI/6)}! !{-$s$*Math.cos(Math.PI/6)}!,!{$s$*Math.sin(Math.PI/6)}!"
    fill="$fill|red$"
    stroke-width="$strkW|2$"
    stroke="$strkC|black$"
    transform="translate($cx$ $cy$) rotate($rot$ 0 0)">
</polygon>
```

the complete example about triangles can be found [here][6]

---

<a name="writeyourplugin"></a>

### Write Your plugin in 5 minutes  

Writing a plugin is extremely easy, just get a look at the _sample.js_ file in the _plugins_ folder or read [how to create a plugin][5]

---

### Hints  

- **absolutely** use only spaces and/or tabs before and after file placeholders
 
- one line files (like already minified ones) **really** slow down the parsing, so the best thing is to avoid the inclusion of minified/packed files.

- to avoid loops Malta stops digging at the tenth nesting level.


### Wired vars  

There are some placeholders that can be used within any involved file:  

- **\_\_TIME\_\_** : the HH : MM : SS build time  
- **\_\_DATE\_\_** : the D / M / YYYY build date   
- **\_\_YEAR\_\_** : the YYYY format build year  
- **\_\_FILES\_\_** : the number of files glued together  
- **\_\_VERSION\_\_** : Malta version  
- **\_\_BUILDNUMBER\_\_** : build number  
- **\_\_FILE\_\_** : template name  
- **\_\_LINE\_\_** : line number  

--------

[0]: https://www.npmjs.org
[1]: plugins/sample.js
[2]: https://github.com/fedeghe/malta/blob/master/src/docs/sample.md
[3]: https://github.com/fedeghe/malta/blob/master/src/docs/plugin-list.md
[4]: https://github.com/fedeghe/malta/blob/master/src/docs/changelog.md
[5]: https://github.com/fedeghe/malta/blob/master/src/docs/create-a-plugin.md
[6]: https://github.com/fedeghe/malta/blob/master/src/docs/triangles.md
