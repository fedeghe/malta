const conc = (n, inst) => `\x1b[1;${n}m${inst}\x1b[0m`;

function rainbowize (offset) {
    offset = offset || 0;
    return function (s) {
        const l = s.length,
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
            ],
            out = [];
        let j = 0;
        for (let i = 0; i < l; i++) {
            out.push(
                s[i] !== ' '
                    ? tpl.replace('%code%', cols[j++ % cols.length]).replace('%char%', s[i])
                    : s[i]
            );
        }
        return out.join('');
    };
}

module.exports = {
    normal: s => conc(0, s),
    darken: s => conc(2, s),
    italic: s => conc(54, s),
    underline: s => conc(4, s),
    blink: s => conc(5, s),
    invert: s => conc(7, s),
    gray: s => conc(30, s),
    red: s => conc(31, s),
    green: s => conc(32, s),
    yellow: s => conc(33, s),
    blue: s => conc(34, s),
    magenta: s => conc(35, s),
    cyan: s => conc(36, s),
    lightgray: s => conc(37, s),
    darkgray: s => conc(90, s),
    lightred: s => conc(91, s),
    lightgreen: s => conc(92, s),
    lightyellow: s => conc(93, s),
    lightblue: s => conc(94, s),
    lightmagenta: s => conc(95, s),
    lightcyan: s => conc(96, s),
    white: s => conc(97, s),
    bgblack: s => conc(40, s),
    bgred: s => conc(41, s),
    bggreen: s => conc(42, s),
    bgyellow: s => conc(43, s),
    bgblue: s => conc(44, s),
    bgmagenta: s => conc(45, s),
    bgcyan: s => conc(46, s),
    bglightgray: s => conc(47, s),
    bgdefault: s => conc(49, s),
    bgdarkgray: s => conc(100, s),
    bglightred: s => conc(101, s),
    bglightgreen: s => conc(102, s),
    bglightyellow: s => conc(103, s),
    bglightblue: s => conc(104, s),
    bglightmagenta: s => conc(105, s),
    bglightcyan: s => conc(106, s),
    bgwhite: s => conc(107, s),
    rainbow: rainbowize(),
    bgrainbow: rainbowize(10)
};
