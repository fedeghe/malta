const colors = require('./colors');

const methods = {
    white: colors.white,
    red: colors.red,
    green: colors.green,
    yellow: colors.yellow,
    gray: colors.gray,
    darkgray: colors.darkgray,
    cyan: colors.cyan,
    darkcyan: colors.darkcyan,
    underline: colors.underline,
    rainbow: colors.rainbow
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
