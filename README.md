Malta
=====

Malta allows to built on the fly big files editing its parts in separated files and assembling in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly, and if it's javascript,
 you'll find even the minified version in the output folder.

installation
------------

If You do not have node installed yet, run:

    $ curl http://npmjs.org/install.sh | sh 
	
then install malta running:

    $ [sudo] npm install malta [-g]


usage
-----

    $ malta templateFile outDirectory

- **templateFile**  
is the base template used as base file. Note that the extension will be inherited by output files.
  
- **outDirectory**  
is the folder where the output files will be written in.


placeholders
------------

Malta uses two kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the templateFile directory 

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

hints
-----

- **absolutely** use only spaces and tabs before file placeholders
 
- minified files **really** slow down the parsing, so the best thing is to avoid the inclusion of minified/packed files.

- to avoid loops Malta stops digging at the tenth nesting level.


wired vars
----------

There are some placeholders that can be used within any involved file:  

- \_\_TIME\_\_ : the HH : MM : SS build time
- \_\_DATE\_\_ : the D / M / YYYY build date   
- \_\_YEAR\_\_ : the YYYY format build year  
- \_\_FILESNUM\_\_ : the number of files glued togheter  
- \_\_VERSION\_\_ : Malta version


changelog
---------
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


foo sample
----------

Supposing in `~/myproject` we have  

    myfile.js
    vars.json
    out/
    src/
    |- a.js
    |- inner/
       |- b.js

<br />
**myfile.js** :
    
    /**
    Name : $name$
    Author: $author$
    Date: __DATE__
    */
    +function(){
        var name = 'what';
        $$src/a.js$$
    }();
<br />
**src/a.js** :  

    function hello(n) {
        alert('Hello ' + n);
        $$src/inner/b.js$$
    }
    hello('Federico'), hello('Federico');
<br />
**src/inner/b.js** :  

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

Let Malta run and try editing the _myproject/myfile.js_ or the _myproject/vars.json_ or one of the involved files, and get a look at the output folder content.  To stop it use Ctrl + c
 
 *Enjoy Malta*