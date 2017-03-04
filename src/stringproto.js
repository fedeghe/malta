function rainbowize (offset) {
	offset = offset || 0;
	return function () {
		var els = this,
			i = 0, j = 0,
			l = els.length,
			tpl = '\033[1;%code%m%char%\033[0m',
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
			],
			out = [];
		for (null; i < l; i++) out.push(els[i] !== ' ' ? tpl.replace('%code%', cols[j++ % cols.length]).replace('%char%', els[i]) : els[i]);
		return out.join('');
	}	
}
String.prototype.normal = function () {return '\033[1;0m' + this + '\033[0m'; };
String.prototype.darken = function () {return '\033[1;2m' + this + '\033[0m'; };
String.prototype.italic = function () {return '\033[1;54m' + this + '\033[0m'; };
String.prototype.underline = function () {return '\033[1;4m' + this + '\033[0m'; };
String.prototype.blink = function () {return '\033[1;5m' + this + '\033[0m'; };
String.prototype.invert = function () {return '\033[1;7m' + this + '\033[0m'; };
String.prototype.gray = function () {return '\033[1;30m' + this + '\033[0m'; };
String.prototype.red = function () {return '\033[1;31m' + this + '\033[0m'; };
String.prototype.green = function () {return '\033[1;32m' + this + '\033[0m'; };
String.prototype.yellow = function () {return '\033[1;33m' + this + '\033[0m'; };
String.prototype.blue = function () {return '\033[1;34m' + this + '\033[0m'; };
String.prototype.magenta = function () {return '\033[1;35m' + this + '\033[0m'; };
String.prototype.cyan = function () {return '\033[1;36m' + this + '\033[0m'; };
String.prototype.lightgray = function () {return '\033[1;37m' + this + '\033[0m'; };
String.prototype.darkgray = function () {return '\033[1;90m' + this + '\033[0m'; };
String.prototype.lightred = function () {return '\033[1;91m' + this + '\033[0m'; };
String.prototype.lightgreen = function () {return '\033[1;92m' + this + '\033[0m'; };
String.prototype.lightyellow = function () {return '\033[1;93m' + this + '\033[0m'; };
String.prototype.lightblue = function () {return '\033[1;94m' + this + '\033[0m'; };
String.prototype.lightmagenta = function () {return '\033[1;95m' + this + '\033[0m'; };
String.prototype.lightcyan = function () {return '\033[1;96m' + this + '\033[0m'; };
String.prototype.white = function () {return '\033[1;97m' + this + '\033[0m'; };
String.prototype.rainbow = rainbowize();

String.prototype.bgblack = function () {return '\033[1;40m' + this + '\033[0m'; };
String.prototype.bgred = function () {return '\033[1;41m' + this + '\033[0m'; };
String.prototype.bggreen = function () {return '\033[1;42m' + this + '\033[0m'; };
String.prototype.bgyellow = function () {return '\033[1;43m' + this + '\033[0m'; };
String.prototype.bgblue = function () {return '\033[1;44m' + this + '\033[0m'; };
String.prototype.bgmagenta = function () {return '\033[1;45m' + this + '\033[0m'; };
String.prototype.bgcyan = function () {return '\033[1;46m' + this + '\033[0m'; };
String.prototype.bglightgray = function () {return '\033[1;47m' + this + '\033[0m'; };
String.prototype.bgdefault = function () {return '\033[1;49m' + this + '\033[0m'; };
String.prototype.bgdarkgray = function () {return '\033[1;100m' + this + '\033[0m'; };
String.prototype.bglightred = function () {return '\033[1;101m' + this + '\033[0m'; };
String.prototype.bglightgreen = function () {return '\033[1;102m' + this + '\033[0m'; };
String.prototype.bglightyellow = function () {return '\033[1;103m' + this + '\033[0m'; };
String.prototype.bglightblue = function () {return '\033[1;104m' + this + '\033[0m'; };
String.prototype.bglightmagenta = function () {return '\033[1;105m' + this + '\033[0m'; };
String.prototype.bglightcyan = function () {return '\033[1;106m' + this + '\033[0m'; };
String.prototype.bgwhite = function () {return '\033[1;107m' + this + '\033[0m'; };
String.prototype.bgrainbow = rainbowize(10);