Triangles
---------

Supposing we want to create a svg file with many equilateral triangles, that should be different in size, position, rotation, border...  
First of all we create the container template:

file: **triangles.svg**  
```
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 300 300" xmlns:svg="http://www.w3.org/2000/svg"  style="outline: 1px solid black;">
    ...??
</svg>
```

now it`s time to create the generic element which will represent the triangle, since it has to be equilateral, we use a bit of trigonometry to build it geometrically given his center and the distance from the center to the 3 vertices.

file : **triangle.svg**  
```
<polygon
    points="0,!{-$s$}! !{$s$*Math.cos(Math.PI/6)}!,!{$s$*Math.sin(Math.PI/6)}! !{-$s$*Math.cos(Math.PI/6)}!,!{$s$*Math.sin(Math.PI/6)}!"
    fill="$fill$"
    stroke-width="$strkW|2$"
    stroke="$strkC|black$"
    transform="translate($cx$ $cy$) rotate($rot$ 0 0)  ">
</polygon>
```

here, in addition to the `!{expression}!` placeholder, we use a special placeholder which looks like `$varname$` or, if a default value is needed, like `$varname|defaultValue$`.  

Now we have just to get back to the _triangles.svg_ template and add as many triangles we want and change their parameters values as needed:

file: **triangles.svg**  
```
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 300 300" xmlns:svg="http://www.w3.org/2000/svg"  style="outline: 1px solid black;">
    $$triangle.svg{cx:110,cy:110,s:100,rot:-45,fill:'red'}$$
    $$triangle.svg{cx:160,cy:160,s:80,rot:-45,fill:'green'}$$
    $$triangle.svg{cx:210,cy:210,s:60,rot:-45,fill:'blue'}$$
</svg>
```

now run  
```
$ malta triangles.svg outputfolder
```
and in the outputfolder we'll find the **triangles.svg** as follows  

![triangles](https://raw.githubusercontent.com/fedeghe/malta/master/src/media/triangles.png)
