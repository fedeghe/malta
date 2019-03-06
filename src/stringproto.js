/* eslint-disable no-control-regex */
function rainbowize (offset) {
	// "use strict"; //no octal lit
	offset = offset || 0;
	return function () {
		const els = this,
			l = els.length,
			tpl = '\x1b[1;%code%m%char%\x1b[0m',
			cols = [
				31 + offset, // red
				32 + offset, // green
				33 + offset, // yellow
				34 + offset, // blue
				35 + offset, // magenta
				36 + offset, // cyan
				91 + offset, // lightred
				92 + offset, // lightgreen
				93 + offset, // lightyellow
				94 + offset, // lightblue
				95 + offset, // lightmagenta
				96 + offset  // lightcyan
			];
		let	i = 0, j = 0,
			out = [];
		for (null; i < l; i++) out.push(els[i] !== ' ' ? tpl.replace('%code%', cols[j++ % cols.length]).replace('%char%', els[i]) : els[i]);
		return out.join('');
	};
}



String.prototype.normal = function () {return [ '\x1b[1;0m', this, '\x1b[0m' ].join(''); };
String.prototype.darken = function () {return [ '\x1b[1;2m', this, '\x1b[0m' ].join(''); };
String.prototype.italic = function () {return [ '\x1b[1;54m', this, '\x1b[0m' ].join(''); };
String.prototype.underline = function () {return [ '\x1b[1;4m', this, '\x1b[0m' ].join(''); };
String.prototype.blink = function () {return [ '\x1b[1;5m', this, '\x1b[0m' ].join(''); };
String.prototype.invert = function () {return [ '\x1b[1;7m', this, '\x1b[0m' ].join(''); };
String.prototype.gray = function () {return [ '\x1b[1;30m', this, '\x1b[0m' ].join(''); };
String.prototype.red = function () {return [ '\x1b[1;31m', this, '\x1b[0m' ].join(''); };
String.prototype.green = function () {return [ '\x1b[1;32m', this, '\x1b[0m' ].join(''); };
String.prototype.yellow = function () {return [ '\x1b[1;33m', this, '\x1b[0m' ].join(''); };
String.prototype.blue = function () {return [ '\x1b[1;34m', this, '\x1b[0m' ].join(''); };
String.prototype.magenta = function () {return [ '\x1b[1;35m', this, '\x1b[0m' ].join(''); };
String.prototype.cyan = function () {return [ '\x1b[1;36m', this, '\x1b[0m' ].join(''); };
String.prototype.lightgray = function () {return [ '\x1b[1;37m', this, '\x1b[0m' ].join(''); };
String.prototype.darkgray = function () {return [ '\x1b[1;90m', this, '\x1b[0m' ].join(''); };
String.prototype.lightred = function () {return [ '\x1b[1;91m', this, '\x1b[0m' ].join(''); };
String.prototype.lightgreen = function () {return [ '\x1b[1;92m', this, '\x1b[0m' ].join(''); };
String.prototype.lightyellow = function () {return [ '\x1b[1;93m', this, '\x1b[0m' ].join(''); };
String.prototype.lightblue = function () {return [ '\x1b[1;94m', this, '\x1b[0m' ].join(''); };
String.prototype.lightmagenta = function () {return [ '\x1b[1;95m', this, '\x1b[0m' ].join(''); };
String.prototype.lightcyan = function () {return [ '\x1b[1;96m', this, '\x1b[0m' ].join(''); };
String.prototype.white = function () {return [ '\x1b[1;97m', this, '\x1b[0m' ].join(''); };
String.prototype.rainbow = rainbowize();

String.prototype.bgblack = function () {return [ '\x1b[1;40m', this, '\x1b[0m' ].join(''); };
String.prototype.bgred = function () {return [ '\x1b[1;41m', this, '\x1b[0m' ].join(''); };
String.prototype.bggreen = function () {return [ '\x1b[1;42m', this, '\x1b[0m' ].join(''); };
String.prototype.bgyellow = function () {return [ '\x1b[1;43m', this, '\x1b[0m' ].join(''); };
String.prototype.bgblue = function () {return [ '\x1b[1;44m', this, '\x1b[0m' ].join(''); };
String.prototype.bgmagenta = function () {return [ '\x1b[1;45m', this, '\x1b[0m' ].join(''); };
String.prototype.bgcyan = function () {return [ '\x1b[1;46m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightgray = function () {return [ '\x1b[1;47m', this, '\x1b[0m' ].join(''); };
String.prototype.bgdefault = function () {return [ '\x1b[1;49m', this, '\x1b[0m' ].join(''); };
String.prototype.bgdarkgray = function () {return [ '\x1b[1;100m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightred = function () {return [ '\x1b[1;101m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightgreen = function () {return [ '\x1b[1;102m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightyellow = function () {return [ '\x1b[1;103m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightblue = function () {return [ '\x1b[1;104m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightmagenta = function () {return [ '\x1b[1;105m', this, '\x1b[0m' ].join(''); };
String.prototype.bglightcyan = function () {return [ '\x1b[1;106m', this, '\x1b[0m' ].join(''); };
String.prototype.bgwhite = function () {return [ '\x1b[1;107m', this, '\x1b[0m' ].join(''); };
String.prototype.bgrainbow = rainbowize(10);
