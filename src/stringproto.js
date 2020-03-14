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
                96 + offset // lightcyan
            ],
            out = [];
        let i = 0, j = 0;
        for (null; i < l; i++) out.push(els[i] !== ' ' ? tpl.replace('%code%', cols[j++ % cols.length]).replace('%char%', els[i]) : els[i]);
        return out.join('');
    };
}

function conc (n, inst) {
    return [
        '\x1b[1;',
        n,
        'm',
        inst,
        '\x1b[0m'
    ].join('');
}

/* eslint-disable no-extend-native */
String.prototype.normal = function () { return conc(0, this); };
String.prototype.darken = function () { return conc(2, this); };
String.prototype.italic = function () { return conc(54, this); };
String.prototype.underline = function () { return conc(4, this); };
String.prototype.blink = function () { return conc(5, this); };
String.prototype.invert = function () { return conc(7, this); };
String.prototype.gray = function () { return conc(30, this); };
String.prototype.red = function () { return conc(31, this); };
String.prototype.green = function () { return conc(32, this); };
String.prototype.yellow = function () { return conc(33, this); };
String.prototype.blue = function () { return conc(34, this); };
String.prototype.magenta = function () { return conc(35, this); };
String.prototype.cyan = function () { return conc(36, this); };
String.prototype.lightgray = function () { return conc(37, this); };
String.prototype.darkgray = function () { return conc(90, this); };
String.prototype.lightred = function () { return conc(91, this); };
String.prototype.lightgreen = function () { return conc(92, this); };
String.prototype.lightyellow = function () { return conc(93, this); };
String.prototype.lightblue = function () { return conc(94, this); };
String.prototype.lightmagenta = function () { return conc(95, this); };
String.prototype.lightcyan = function () { return conc(96, this); };
String.prototype.white = function () { return conc(97, this); };
String.prototype.rainbow = rainbowize();

String.prototype.bgblack = function () { return conc(40, this); };
String.prototype.bgred = function () { return conc(41, this); };
String.prototype.bggreen = function () { return conc(42, this); };
String.prototype.bgyellow = function () { return conc(43, this); };
String.prototype.bgblue = function () { return conc(44, this); };
String.prototype.bgmagenta = function () { return conc(45, this); };
String.prototype.bgcyan = function () { return conc(46, this); };
String.prototype.bglightgray = function () { return conc(47, this); };
String.prototype.bgdefault = function () { return conc(49, this); };
String.prototype.bgdarkgray = function () { return conc(100, this); };
String.prototype.bglightred = function () { return conc(101, this); };
String.prototype.bglightgreen = function () { return conc(102, this); };
String.prototype.bglightyellow = function () { return conc(103, this); };
String.prototype.bglightblue = function () { return conc(104, this); };
String.prototype.bglightmagenta = function () { return conc(105, this); };
String.prototype.bglightcyan = function () { return conc(106, this); };
String.prototype.bgwhite = function () { return conc(107, this); };
String.prototype.bgrainbow = rainbowize(10);
/* eslint-enable no-extend-native */
