require('../../src/stringproto');

const colors = require('../../src/colors');

describe('colors module', function () {
    const str = "hello",
        map = {
            "normal" : 0, "darken" : 2, "italic" : 54, "underline" : 4,
            "blink" : 5, "invert" : 7, "gray" : 30, "red" : 31,
            "green" : 32, "yellow" : 33, "blue" : 34, "magenta" : 35,
            "cyan" : 36, "lightgray" : 37, "darkgray" : 90, "lightred" : 91,
            "lightgreen" : 92, "lightyellow" : 93, "lightblue" : 94, "lightmagenta" : 95,
            "lightcyan" : 96, "white" : 97, "bgblack" : 40, "bgred" : 41,
            "bggreen" : 42, "bgyellow" : 43, "bgblue" : 44, "bgmagenta" : 45,
            "bgcyan" : 46, "bglightgray" : 47, "bgdefault" : 49, "bgdarkgray" : 100,
            "bglightred" : 101, "bglightgreen" : 102, "bglightyellow" : 103, "bglightblue" : 104,
            "bglightmagenta" : 105, "bglightcyan" : 106, "bgwhite" : 107
        };

    let i;

    it("should have the right colors", function () {
        for (i in map) {
            expect(colors[i](str)).toBe("\x1b[1;" + map[i] + "m" + str + "\x1b[0m");
        }
    });
    it ("should have the rainbow color", function () {
        expect(colors.rainbow(str).length).toBeGreaterThan(0);
    });
    it ("should have the rainbow color (blank)", function () {
        expect(colors.rainbow('a b c d e f').length).toBeGreaterThan(0);
    });
});

describe('String.prototype colors', function () {
    it("should extend String.prototype with color methods", function () {
        expect(typeof ''.red).toBe('function');
        expect(typeof ''.green).toBe('function');
        expect(typeof ''.yellow).toBe('function');
        expect(typeof ''.white).toBe('function');
        expect(typeof ''.gray).toBe('function');
        expect(typeof ''.darkgray).toBe('function');
        expect(typeof ''.cyan).toBe('function');
        expect(typeof ''.darkcyan).toBe('function');
        expect(typeof ''.underline).toBe('function');
        expect(typeof ''.rainbow).toBe('function');
    });

    it("should return colored strings", function () {
        expect('hello'.red()).toBe(colors.red('hello'));
        expect('hello'.green()).toBe(colors.green('hello'));
        expect('hello'.yellow()).toBe(colors.yellow('hello'));
        expect('hello'.white()).toBe(colors.white('hello'));
    });

    it("should be non-enumerable", function () {
        const keys = [];
        for (const k in '') keys.push(k);
        expect(keys).not.toContain('red');
        expect(keys).not.toContain('green');
    });
});
