malta
=====

nodejs file builder

Malta allows to built on the fly big files editing its parts in separated files and assembling in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly, and if it's javascript,
 you'll find even the minified version in the output folder.

installation
------------
`[sudo] npm install malta [-g]`  


usage
-----
`malta templateFile outDirectory`  

**templateFile** :  
is the base template used to build the big ones. That file must be relative to path from where You start Malta.  
  
**outDirectory**  
is the folder where the output files will be written in. That path must be relative to path from where You start Malta.  


placeholders
------------
Malta uses two kind of placeholders, to be used in the main template or in any file involved (but vars.json)  
- **file** : `$$filePath$$`  
  here _filepath_ is the path to the desired file relative to the directory containing the base template  
- **variable** : `$varname$`  
  here _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the same folder where is the base template  

**Hint** : to avoid loops Malta stops digging at the tenth nesting level.

sample
---
Supposing in `~/myproject` we have  
<pre><code>myfile.tpl
conf.json
out/
src/
|- a.js
|- inner/
   |- b.js
</code></pre>
<br />
**myfile.tpl** :
<pre><code>/**
Name : $name$
Author: $author$
Date: __DATE__
*/
+function(){
    var name = 'what';
    $$src/a.js$$
}();
</code></pre>
<br />
**src/a.js** : 
<pre><code>function hello(n) {
    alert('Hello ' + n);
    $$src/inner/b.js$$
}</code></pre>
<br />
**src/inner/b.js** : 
<pre><code>hello = function () {
    alert('Hello again ' + n);
};</code></pre>
<br />
and least but not last **vars.json** : 
<pre><code>{
"name":"myFabulousProject",
"author":"Federico"
}</code></pre>
<br />
**Now** from ~ we execute:  
`malta myproject/myfile.tpl myproject/out`  
in a while Malta will confirm the first creation of _myfile.js_ and _myfile.min.js_ in the _out/_ folder.  
<br />
This is the not minified code :  
<pre><code>/**
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
}();</code></pre>

Let Malta run and try editing the _myproject.tpl_ or the _vars.json_ or one of the involved files, and get a look at the output folder content.  
 
 *Enjoy Malta*