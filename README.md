malta
=====

node javascript builder

Malta allows to built on the fly big javascript files editing its parts in separated files and assembing in one following a main template file.  
As You start Malta you can start editing every file involved and the resulting file will be updated on the fly.  

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
Malta uses two kind of placeholders
- **file** : `$$filePath$$`  
  here _filepath_ is the path to the desired file relative to the directory containing the base template
- **variable** : `$varname$`  
  here _varname_ is the key for a variable that Malta will search in a _vars.json_ file that should be found in the same folder where is the base template  
