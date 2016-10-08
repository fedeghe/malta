Malta
=====

Malta allows to built on the fly big files editing its parts in separated files and assembling in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly, and if it's javascript,
 you'll find even the minified version in the output folder.

Installation
------------

If You do not have node installed yet, run:

    $ curl http://npmjs.org/install.sh | sh 
    
then install malta running:

    $ [sudo] npm install malta [-g]


Usage
-----

    $ malta templateFile outDirectory [-vars=nonDefault_vars_path] [-o={0|1|2|3}]  [-base62={true|false}]  [-shrink={true|false}]
        
- **templateFile**  
is the base template used as base file. Note that the extension will be inherited by output files (but for .less & .sass files).
  
- **outDirectory**  
is the folder where the output files will be written in.

- **nonDefaultVarsPath**
here is possible to tell Malta to consider a different file for variables (defaut would be vars.json in the templateFiel folder)

- the **-o** is used only for .js, .css, .less, sass files (default value is 1):  

| -o        | js           | css, less, sass  |
|:---|:---|:---|
| 0 | plain compiled | plain compiled |
| 1 | plain compiled and .min.js (uglify-js) |   plain compiled and .min.css (uglify-css) |
| 2 | plain compiled AND the .pack.js (packer) |    default  (as if 1) |
| 3 | plain compiled AND both .min.js and .pack.js |    default (as if 1) |

- the **-base62** and **-shrink** parameters has effect only for .js files and the packer is involved (-o > 1) and act as can be easily expected (default values are base62=true and shrink=false)



Seen that most of times it would be handy to engage many builds at once it`s possible to start Malta as follows: 

    $ malta list.json
    
where *list.json* is a file containing one or more pairs, that commits Malta to build more than one file in one shot:

- **list.json** :
    
        {
            "palette.less" : "../../public_html/css -vars=./vars/deploy.json -o=0",
            "common.less" : "../../public_html/css -vars=./vars/deploy.json",
            "common.js" : "../../public_html/js",
            "lib.js" : "../../public_html/js -o=3 -base62=false -shrink=true",
            ...
        }

Placeholders
------------

Malta uses three kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the templateFile directory; if starts with / then will be relative to the execution folder

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

- **!{expression}!**
  _expression_ can contain anything that must be evaluated (eval is used)

Hints
-----

- **absolutely** use only spaces and tabs before file placeholders
 
- minified files **really** slow down the parsing, so the best thing is to avoid the inclusion of minified/packed files.

- to avoid loops Malta stops digging at the tenth nesting level.


Wired vars
----------

There are some placeholders that can be used within any involved file:  

- \_\_TIME\_\_ : the HH : MM : SS build time
- \_\_DATE\_\_ : the D / M / YYYY build date   
- \_\_YEAR\_\_ : the YYYY format build year  
- \_\_FILESNUM\_\_ : the number of files glued togheter  
- \_\_VERSION\_\_ : Malta version
- \_\_BUILDNUMBER\_\_ : build number


Foo sample
----------

Supposing in `~/myproject/` folder there is the following  

    myfile.js
    vars.json
    out/
    src/
    |- a.js
    |- inner/
       |- b.js

<br />
The most important is the Malta template file being the first file used to build the glued file. 

Here use the Malta placeholders and/or the wired vars to specify which files/variables must be included.

**myfile.js** :
    
    /**
    // use the `name` and `author` variables from the vars.json
    // the wired __DATE__ variable
    //
    Name : $name$           
    Author: $author.ns$
    Project : $more.repo$
    Date: __DATE__
    */
    +function(){
        var name = 'what',
            data = $data$,
            tenPrimes = $tenPrimes$;
        
        // write here the content of the src/a.js file 
        // the path is relative to the template folder
        //
        $$src/a.js$$   
        console.debug(!{$width$ * $height$ / 7 - 8}!) // new 'comp' placeholder (>=2.3.8) 
    }();
<br />
and here is the **src/a.js** :  

    function hello(n) {
        alert('Hello ' + n);
        
        // as before, always relative to the template
        // even if this was at 10th inclusion level
        //
        $$src/inner/b.js$$  
    }                       
    hello('Federico'), hello('Federico');
<br />
the last content file for that dummy sample is **src/inner/b.js** :  

    hello = function () {
        alert('Hello again ' + n);
    };
<br />
and least but not last **vars.json** :  

    {
        "name":"myFabulousProject",
        "author":{
            "name" : "Federico",
            "surname" : "Ghedina",
            "ns" : "$author.name$ $author.surname$"
        },
        "more" : {
            "repo" : "https://github.com/fedeghe/malta"
        },
        "data" : {
            "namesurname" : "$author.name$ - $author.surname$"
        },
        "tenPrimes" : [2, 3, 5, 7, 11, 13, 17, 19, 23, 29],
        "width" : 112,
        "height" :124
    }  
<br />
**Now** from ~ execute:  

     malta myproject/myfile.js myproject/out [-vars=myproject/local/variables.json]
in a while Malta will confirm the first creation of _myproject/out/myfile.js_ and _myproject/out/myfile.min.js_.  
<br />
The _myproject/out/myfile.js_ will look like:  

    /**
    Name : myFabulousProject
    Author: Federico Ghedina
    Project : https://github.com/fedeghe/malta
    Date: 11/9/2013
    */
    +function(){ 
        var name = 'what',
            data = {"namesurname":"Federico - Ghedina"},
            tenPrimes = [2,3,5,7,11,13,17,19,23,29];
        function hello(n) {
            alert('Hello ' + n);
            hello = function () {
                alert('Hello again ' + n);
            };
        }
        hello('Federico'), hello('Federico');
        console.debug(1976)
    }();

<br/>
Let Malta run and try editing the _myproject/myfile.js_ or the _myproject/vars.json_ (or the overridden one) or one of the involved files, and get a look at the output folder content.  To stop it use Ctrl + c. 


<br/>
Less, Sass, js minification, markdown and svg  

------------------------------------

- When dealing with `.less` or `.scss` template files they will be compiled thanks to [less][1] and [sass][2] [npmjs][3] packages. 

- Thanks to other three packages, [uglify-js][4], [uglifycss][5] and [packer][8] for every output `.js` will be written a minified and a packed version and for every `.css` file will be written a minified version (thus even for `.less` and `.scss`).

- Thanks again to other two pakages [markdown][6] & [markdown-pdf][7], every template with .pdf.md will produce a .pdf file AND every template with .md will produce a glued .md and the resulting .html file.

- Thanks to another pakages [svg-to-png][9] , every template with .svg will produce even a .png file.
 




Changelog
--------- 
- **2.4.1** removed some unuseful messages from console
- **2.4.0** .svg files will automatically output even a .png
- **2.3.8** added _comp_ placeholder for evaluate simple arithmentic expressions
- **2.3.7** better handling for `less` compiler exceptions 
- **2.3.5** fixed some typos in the README file 
- **2.2.8** var placeholder replace with JSON.stringify output in case of object 
- **2.2.7** new options available for files that can be minified/packed 
- **2.2.6** fixed a small bug in the console ouput messages for the packed versions of js files
- **2.2.5** in case of js files will be written even a packed version using the amazing Dean Edwards npm port
- **2.2.4** added detection for placeholders loops into the variable json
- **2.2.3** variables json can contain inner placeholders at any level
- **2.2.2** fixed a bug related to vars substitution
- **2.2.1** in file placeholders is possible to use absolute paths, will be based on to the execution path;
            vars.json file can contain deeper literals that can be references with . or / separator in the placeholder (see examples above)
- **2.2.0** some refactors
- **2.1.3** in vars.json nested vars can be used
- **2.0.6** markdown to pdf support added, just use .pdf.md for the templates file
- **2.0.5** markdown support added, every .md tpl will produce the glued .md and resulting .html file
- **2.0.4** lack of --force drives to a new version just to remove a console.log !!!
- **2.0.3** is possible to specify the complete path (relative to the execution folder) of the variable json. 
- **2.0.2** if using a json file for multi build, a ! as first key character will tell Malta to ignore this line
- **2.0.1** fixed README links
- **2.0.0** no more stop if the same file is included more times, still check for loops over 5000 files
- **1.1.1** removed some ugly and unuseful messages from console
- **1.1.0** updated console usage message
- **1.0.21** fixed a bug naming minified css
- **1.0.20** added support for .scss files, fixed a bug using less package
- **1.0.19** fixed a bug that hanged the process when, being not caught, a parsing exception was thrown by uglify-js and/or uglifycss
- **1.0.18** some refactors and corrections to console output
- **1.0.17** automatically write even minified version for css files (even less originated)
- **1.0.16** accepts a json to execute multiple builds with one call
- **1.0.15** removed beginning os specific slash in inclusion comments
- **1.0.14** some fixes and refactor
- **1.0.13** \_\_BUILDNUMBER\_\_ predefined build number var (file based)
- **1.0.12** fixed path sep for win####
- **1.0.11** fixed deadly circular inclusion check; update only modified files
- **1.0.10** xml files indentation for inner files removed
- **1.0.9** some minor fixes on messages
- **1.0.8** hint paths changed
- **1.0.7** added support for .less files
- **1.0.5** real path is included only for .xml .js .css files
- **1.0.3** real path included just before every inclusion
- **1.0.1** not found $vname$ placeholders are untouched
- **1.0** added \_\_FILESNUM\_\_, \_\_VERSION\_\_ to the placeholders builtin set
- **0.0.11** fixed inclusion indentation
- **0.0.10** involved files count fixed
- **0.0.9** fixed build on vars.json change
- **0.0.8** parse error thrown by uglify is catched and stops no more Malta

--------

[1]: https://www.npmjs.org/package/less
[2]: https://www.npmjs.org/package/sass
[3]: https://www.npmjs.org
[4]: https://www.npmjs.org/package/uglify-js
[5]: https://www.npmjs.org/package/uglifycss
[6]: https://www.npmjs.com/package/markdown-pdf
[7]: https://www.npmjs.com/package/markdown
[8]: https://www.npmjs.com/package/packer
[9]: https://www.npmjs.com/package/svg-to-png