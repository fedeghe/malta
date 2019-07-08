var a = maltaE(maltaV('tpl.zero') * 2) 
+ maltaE(maltaV('tpl.one')
 * 3 + maltaV('tpl.two') * 5),
    b = maltaE(maltaV('tplArr.0') * 2)
     + maltaE(maltaV('tplArr.1')* 3 + maltaV('tplArr.2') * Math.pow(5, 1) ),
    c = "maltaV('tplArr.3.what')",
    e = maltaV('shpere.radius'),
    d = Math.pow(e, 3)* 4 / 3 * Math.PI,
    sphereVolume = maltaE(d);
