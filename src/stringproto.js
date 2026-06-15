const colors = require('./colors');

const methods = {
    normal: colors.normal,
    darken: colors.darken,
    italic: colors.italic,
    underline: colors.underline,
    blink: colors.blink,
    invert: colors.invert,
    gray: colors.gray,
    red: colors.red,
    green: colors.green,
    yellow: colors.yellow,
    blue: colors.blue,
    magenta: colors.magenta,
    cyan: colors.cyan,
    darkcyan: colors.darkcyan,
    lightgray: colors.lightgray,
    darkgray: colors.darkgray,
    lightred: colors.lightred,
    lightgreen: colors.lightgreen,
    lightyellow: colors.lightyellow,
    lightblue: colors.lightblue,
    lightmagenta: colors.lightmagenta,
    lightcyan: colors.lightcyan,
    white: colors.white,
    rainbow: colors.rainbow,
    bgblack: colors.bgblack,
    bgred: colors.bgred,
    bggreen: colors.bggreen,
    bgyellow: colors.bgyellow,
    bgblue: colors.bgblue,
    bgmagenta: colors.bgmagenta,
    bgcyan: colors.bgcyan,
    bglightgray: colors.bglightgray,
    bgdefault: colors.bgdefault,
    bgdarkgray: colors.bgdarkgray,
    bglightred: colors.bglightred,
    bglightgreen: colors.bglightgreen,
    bglightyellow: colors.bglightyellow,
    bglightblue: colors.bglightblue,
    bglightmagenta: colors.bglightmagenta,
    bglightcyan: colors.bglightcyan,
    bgwhite: colors.bgwhite
};

for (const name in methods) {
    if (Object.prototype.hasOwnProperty.call(methods, name)) {
        // eslint-disable-next-line no-extend-native
        Object.defineProperty(String.prototype, name, {
            value: function () {
                return methods[name](this);
            },
            writable: true,
            configurable: true,
            enumerable: false
        });
    }
}
