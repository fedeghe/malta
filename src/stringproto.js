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

function normal() { return ['\x1b[1;0m', this, '\x1b[0m'].join(''); };
function darken() { return ['\x1b[1;2m', this, '\x1b[0m'].join(''); };
function italic() { return ['\x1b[1;54m', this, '\x1b[0m'].join(''); };

function underline() { return ['\x1b[1;4m', this, '\x1b[0m'].join(''); };
function blink() { return ['\x1b[1;5m', this, '\x1b[0m'].join(''); };
function invert() { return ['\x1b[1;7m', this, '\x1b[0m'].join(''); };
function gray() { return ['\x1b[1;30m', this, '\x1b[0m'].join(''); };
function red() { return ['\x1b[1;31m', this, '\x1b[0m'].join(''); };
function green() { return ['\x1b[1;32m', this, '\x1b[0m'].join(''); };
function yellow() { return ['\x1b[1;33m', this, '\x1b[0m'].join(''); };
function blue() { return ['\x1b[1;34m', this, '\x1b[0m'].join(''); };
function magenta() { return ['\x1b[1;35m', this, '\x1b[0m'].join(''); };
function cyan() { return ['\x1b[1;36m', this, '\x1b[0m'].join(''); };
function lightgray() { return ['\x1b[1;37m', this, '\x1b[0m'].join(''); };
function darkgray() { return ['\x1b[1;90m', this, '\x1b[0m'].join(''); };
function lightred() { return ['\x1b[1;91m', this, '\x1b[0m'].join(''); };
function lightgreen() { return ['\x1b[1;92m', this, '\x1b[0m'].join(''); };
function lightyellow() { return ['\x1b[1;93m', this, '\x1b[0m'].join(''); };
function lightblue() { return ['\x1b[1;94m', this, '\x1b[0m'].join(''); };
function lightmagenta() { return ['\x1b[1;95m', this, '\x1b[0m'].join(''); };
function lightcyan() { return ['\x1b[1;96m', this, '\x1b[0m'].join(''); };
function white() { return ['\x1b[1;97m', this, '\x1b[0m'].join(''); };


function bgblack() { return ['\x1b[1;40m', this, '\x1b[0m'].join(''); };
function bgred() { return ['\x1b[1;41m', this, '\x1b[0m'].join(''); };
function bggreen() { return ['\x1b[1;42m', this, '\x1b[0m'].join(''); };
function bgyellow() { return ['\x1b[1;43m', this, '\x1b[0m'].join(''); };
function bgblue() { return ['\x1b[1;44m', this, '\x1b[0m'].join(''); };
function bgmagenta() { return ['\x1b[1;45m', this, '\x1b[0m'].join(''); };
function bgcyan() { return ['\x1b[1;46m', this, '\x1b[0m'].join(''); };
function bglightgray() { return ['\x1b[1;47m', this, '\x1b[0m'].join(''); };
function bgdefault() { return ['\x1b[1;49m', this, '\x1b[0m'].join(''); };
function bgdarkgray() { return ['\x1b[1;100m', this, '\x1b[0m'].join(''); };
function bglightred() { return ['\x1b[1;101m', this, '\x1b[0m'].join(''); };
function bglightgreen() { return ['\x1b[1;102m', this, '\x1b[0m'].join(''); };
function bglightyellow() { return ['\x1b[1;103m', this, '\x1b[0m'].join(''); };
function bglightblue() { return ['\x1b[1;104m', this, '\x1b[0m'].join(''); };
function bglightmagenta() { return ['\x1b[1;105m', this, '\x1b[0m'].join(''); };
function bglightcyan() { return ['\x1b[1;106m', this, '\x1b[0m'].join(''); };
function bgwhite() { return ['\x1b[1;107m', this, '\x1b[0m'].join(''); };
const bgrainbow = rainbowize(10);
const rainbow = rainbowize();


String.prototype.normal = normal;
String.prototype.darken = darken;
String.prototype.italic = italic;
String.prototype.underline = underline;
String.prototype.blink = blink;
String.prototype.invert = invert;
String.prototype.gray = gray;
String.prototype.red = red;
String.prototype.green = green;
String.prototype.yellow = yellow;
String.prototype.blue = blue;
String.prototype.magenta = magenta;
String.prototype.cyan = cyan;
String.prototype.lightgray = lightgray;
String.prototype.darkgray = darkgray;
String.prototype.lightred = lightred;
String.prototype.lightgreen = lightgreen;
String.prototype.lightyellow = lightyellow;
String.prototype.lightblue = lightblue;
String.prototype.lightmagenta = lightmagenta;
String.prototype.lightcyan = lightcyan;
String.prototype.white = white;
String.prototype.rainbow = rainbow;

String.prototype.bgblack = bgblack;
String.prototype.bgred = bgred;
String.prototype.bggreen = bggreen;
String.prototype.bgyellow = bgyellow;
String.prototype.bgblue = bgblue;
String.prototype.bgmagenta = bgmagenta;
String.prototype.bgcyan = bgcyan;
String.prototype.bglightgray = bglightgray;
String.prototype.bgdefault = bgdefault;
String.prototype.bgdarkgray = bgdarkgray;
String.prototype.bglightred = bglightred;
String.prototype.bglightgreen = bglightgreen;
String.prototype.bglightyellow = bglightyellow;
String.prototype.bglightblue = bglightblue;
String.prototype.bglightmagenta = bglightmagenta;
String.prototype.bglightcyan = bglightcyan;
String.prototype.bgwhite = bgwhite;
String.prototype.bgrainbow = bgrainbow;

module.exports = {
	normal,
	darken,
	italic,
	underline,
	blink,
	invert,
	gray,
	red,
	green,
	yellow,
	blue,
	magenta,
	cyan,
	lightgray,
	darkgray,
	lightred,
	lightgreen,
	lightyellow,
	lightblue,
	lightmagenta,
	lightcyan,
	white,

	bgblack,
	bgred,
	bggreen,
	bgyellow,
	bgblue,
	bgmagenta,
	bgcyan,
	bglightgray,
	bgdefault,
	bgdarkgray,
	bglightred,
	bglightgreen,
	bglightyellow,
	bglightblue,
	bglightmagenta,
	bglightcyan,
	bgwhite,
	rainbow,
	bgrainbow
};
