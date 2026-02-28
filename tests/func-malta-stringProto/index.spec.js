const assert = require('assert');

require('../../src/stringproto.js')

describe('string proto', function () {
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
                assert.equal(String.prototype[i].call(str), "\x1b[1;" + map[i] + "m" + str + "\x1b[0m");
            }
        });
    it ("should have the rainbow color", function () {
        assert.ok(str.rainbow().length > 0);
    });
    it ("should have the rainbow color (blank)", function () {
        assert.ok('a b c d e f'.rainbow().length > 0);
    });
});