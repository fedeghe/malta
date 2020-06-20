sample usage
------------

Supposing in `~/myproject/` folder there is the following:  

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

_**myfile.js**_ :  
``` js 
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
    $$src/a.js$$ // or maltaF('src/a.js') if placeholderMode='func' is passed in options ***
    console.debug(!{$width$ * $height$ / 7 - 8}!) // or maltaE(MaltaV('width') * MaltaV('height') / 7 - 8) ***
}();
```
and here is the _**src/a.js**_ :  
``` js
function hello(n) {
    alert('Hello ' + n);
    
    // as before, always relative to the template
    // even if this was at 10th inclusion level
    //
    $$src/inner/b.js$$ // or maltaF('src/inner/b.js') ***
}                       
hello('Federico'), hello('Federico');
```
the last content file for that dummy sample is _**src/inner/b.js**_ :  
``` js
hello = function () {
    alert('Hello again ' + n);
};
```
and least but not last **vars.json** :  
``` json
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
```

**Now** from ~ execute:  

```
$ malta myproject/myfile.js myproject/out [-vars=myproject/local/variables.json]
```
in a while Malta will confirm the first creation of _**myproject/out/myfile.js**_ and _**myproject/out/myfile.min.js**_.  

The _**myproject/out/myfile.js**_ will look like:  

``` js
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
```

Let Malta run and try editing the _**myproject/myfile.js**_ or the _myproject/vars.json_ (or the overridden one) or one of the involved files, and get a look at the output folder content.  To stop it use Ctrl + c. 