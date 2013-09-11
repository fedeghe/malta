Malta
=====

nodejs file builder

Malta allows to built on the fly big files editing its parts in separated files and assembling in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly, and if it's javascript,
 you'll find even the minified version in the output folder.

installation
------------
    [sudo] npm install malta [-g]


###usage
    malta templateFile outDirectory

- **templateFile**  
is the base template used to build the big ones. That file must be relative to path from where  You start Malta.  
  
- **outDirectory**  
is the folder where the output files will be written in. That path must be relative to path from  where You start Malta.  


###placeholders

Malta uses two kind of placeholders, to be used in the main template or in any file involved (but vars.json)  

- **$$filePath$$**  
  _filepath_ is the path to the desired file relative to the template directory  

- **$varname$**  
  _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the template folder  

**Hint** : to avoid loops Malta stops digging at the tenth nesting level.

###wired vars
There are some placeholders that cen be used within any involved file:  

- \_\_TIME\_\_ : the HH : MM : SS build time
- \_\_DATE\_\_ : the D / M / YYYY build date   
- \_\_YEAR\_\_ : the YYYY format build year


###a sample


Supposing in `~/myproject` we have  

    myfile.tpl
    vars.json
    out/
    src/
    |- a.js
    |- inner/
       |- b.js

<br />
**myfile.tpl** :

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
**Now** from ~ we execute:  
`malta myproject/myfile.tpl myproject/out`  
in a while Malta will confirm the first creation of _myfile.js_ and _myfile.min.js_ in the _out/_ folder.  
<br />
This is the not minified code :  

    /**
    Name : myFabulousProject
    Author: Federico
    Date: 11-9-2013
    */
    +function(){
        var name = 'what';
        function hello(n) {
          alert('Hello ' + n);
          hello = function () {
            alert('Hello again ' + n);
        };
      }
    }();

Let Malta run and try editing the _myproject.tpl_ or the _vars.json_ or one of the involved files, and get a look at the output folder content.  To stop it use Ctrl + c
 
 *Enjoy Malta*