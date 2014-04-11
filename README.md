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

    $ malta templateFile outDirectory
    	
- **templateFile**  
is the base template used as base file. Note that the extension will be inherited by output files.
  
- **outDirectory**  
is the folder where the output files will be written in.

Seen that most of times it would be handy to engage many builds at once it`s possible to start Malta as follows: 

	$ malta list.json
	
where *list.json* is a file containing one or more pairs, that commits Malta to build more than one file in one shot:

- **list.json** :
    
	    {
    		"common.less" : "../../public_html/css",
    		"common.js" : "../../public_html/js",
    		...
    	}

Placeholders
------------

Malta uses two kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the templateFile directory 

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

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
    Author: $author$
    Date: __DATE__
    */
    +function(){
        var name = 'what';
        
		// write here the content of the src/a.js file 
		// the path is relative to the template folder
		//
        $$src/a.js$$	
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
    "author":"Federico"
    }  
<br />
**Now** from ~ execute:  

     malta myproject/myfile.js myproject/out
in a while Malta will confirm the first creation of _myproject/out/myfile.js_ and _myproject/out/myfile.min.js_.  
<br />
The _myproject/out/myfile.js_ will look like:  

    /**
    Name : myFabulousProject
    Author: Federico
    Date: 11/9/2013
    */
    +function(){
        var name = 'what';
        function hello(n) {
            alert('Hello ' + n);
            hello = function () {
                alert('Hello again ' + n);
            };
        }
        hello('Federico'), hello('Federico');
    }();

<br/>
Let Malta run and try editing the _myproject/myfile.js_ or the _myproject/vars.json_ or one of the involved files, and get a look at the output folder content.  To stop it use Ctrl + c. 


<br/>
Less and minification
------------- 

- In the special `js` files case (thanks to the **uglyfy-js** node package) will be even produced a _myfile.min.js_

- If the templace has a `less` extension (thanks to the **less** node package) the result content will be parsed as less before being written

 




Changelog
---------
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