var a = maltaExpression(maltaVar('tpl.zero') * 2) + maltaExpression(maltaVar('tpl.one') * 3 + maltaVar('tpl.two') * 5),
	b = maltaExpression(maltaVar('tplArr.0') * 2) + maltaExpression(maltaVar('tplArr.1') * 3 + maltaVar('tplArr.2') * 5 ),
    c = "maltaVar('tplArr.3.what')",
    e = maltaVar('shpere.radius'),
    d = Math.pow(e, 3)* 4 / 3 * Math.PI,
    sphereVolume = maltaExpression(d);
