#!/usr/bin/env node
const Malta = require('./malta'),
    path = require('path'),
    functions = require('./functions'),
    execPath = process.cwd(),
    args = process.argv.splice(2),
    len = args.length;

process.title = 'Malta';

function print (msg, i, tot) {
    const perc = (typeof i !== 'undefined' && typeof tot !== 'undefined')
        ? [parseInt(100 * i / tot, 10), '% '].join('').white()
        : '';
    Malta.log_debug(perc + msg);
}

(function _M (_args, _len) {
    function go (_runs) {
        for (let tpl in _runs) {
            // check if is inclusion {whatever.json : true}
            //
            if (tpl.match(/\.json$/) && _runs[tpl] === true) {
                _M([tpl], 1);
            } else {
                // skip if key begins with !
                if (tpl.match(/^!/)) continue;
                functions.multi(tpl, _runs[tpl]);
            }
        }
    }

    // no params -> print help and exit
    if (_len === 0) {
        global.BIN_MODE && Malta.log_help();

        // just one param is given -> is a build json file
        //
    } else if (_len === 1) {
        Malta.outVersion();

        if (_args[0].match(/^-/)) {
            functions.subCommand(_args[0]);
            Malta.stop();
        }

        const p = path.resolve(execPath, _args[0]),
            runs = Malta.getRunsFromPath(p);

        if (!runs) Malta.badargs(p);
        if ('EXE' in runs) {
            (function (commands) {
                Malta.log_info([
                    Malta.NL,
                    'EXE'.red(),
                    'section for',
                    _args[0]
                ].join(' '));

                let i = 0;

                const isArray = commands instanceof Array,
                    clen = commands.length;
                if (clen) {
                    if (isArray) {
                        (function start () {
                            if (i < clen - 1) {
                                print(`execution: ${commands[i]}`, i + 1, clen);
                                Malta.execute(commands[i].split(/\s/), () => {
                                    ++i;
                                    start();
                                });
                            } else {
                                print(`execution: ${commands[i]}`, i + 1, clen);
                                Malta.execute(commands[i].split(/\s/), () => {
                                    print('...done!\n');
                                    delete runs.EXE;
                                    go(runs);
                                });
                            }
                        })();
                    } else {
                        print(`execution: ${commands}`, 1, 1);
                        Malta.execute(commands.split(/\s/), function () {
                            print(`...done!${Malta.NL}`);
                            delete runs.EXE;
                            go(runs);
                        });
                    }
                } else {
                    go(runs);
                }
            })(runs.EXE);
        } else {
            go(runs);
        }

        // single build
    } else {
        Malta.outVersion();
        Malta.get().check(_args).start();
    }
})(args, len);

module.exports = Malta;
