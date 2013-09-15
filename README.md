Malta
=====

Malta allows to built on the fly big files editing its parts in separated files and assembling in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly, and if it's javascript,
 you'll find even the minified version in the output folder.

installation
------------
    [sudo] npm install malta [-g]


usage
-----
    malta templateFile outDirectory

- **templateFile**  
is the base template used as base file. That file must be relative to the path from where You start Malta. Note that the extension will be inherited by output files.
  
- **outDirectory**  
is the folder where the output files will be written in. That path must be relative to path from  where You start Malta.  


placeholders
------------

Malta uses two kind of placeholders, to be used in the main template or in any file involved (but _vars.json_)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the template directory  

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

**Hint** : to avoid loops Malta stops digging at the tenth nesting level.

wired vars
----------

There are some placeholders that can be used within any involved file:  

- \_\_TIME\_\_ : the HH : MM : SS build time
- \_\_DATE\_\_ : the D / M / YYYY build date   
- \_\_YEAR\_\_ : the YYYY format build year


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