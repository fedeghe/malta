#!/usr/bin/env node
let processNum = 0;

const Malta = require('./malta'),
    watcher = require('./observe'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    // eslint-disable-next-line quotes
    NL = "\n",

    multi = (key, el) => {
        const multi = key.match(/(.*)\/\*\.(.*)$/),
            isCommand = Malta.isCommand(key),
            exclude = filename => filename.match(/\.buildNum\.json$/),
            multiElements = {};

        let noDemon = key.match(/#(.*)/),
            folder,
            ext;

        if (!isCommand && multi) {
            noDemon = multi[0].match(/#(.*)/);
            folder = multi[1];
            ext = multi[2];
            fs.readdir(folder.replace(/^#/, ''), (err, files) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.log(err);
                    throw err;
                }
                if (files) {
                    files.forEach(file => {
                        if (!exclude(file) && file.match(new RegExp(`.*\\.${ext}$`))) {
                            // store the process
                            ++processNum;
                            multiElements[file] = proceed(`${folder}/${file}`, el);
                        }
                    });
                }
            });

            // if demon mode then observe folder, add / remove
            //
            if (!noDemon) {
                watcher.observe(folder, (diff, extension) => {
                    diff.added.filter(function (v) {
                        return v.match(new RegExp(`.*\\.${extension}$`));
                    }).forEach(v => {
                        if (exclude(v)) return;
                        ++processNum;
                        multiElements[v] = proceed(`${folder}/${v}`, el);
                        Malta.log_debug(`${'ADDED'.yellow()} ${folder}/${v}${NL}`);
                    });

                    diff.removed.filter(v => {
                        return v.match(new RegExp(`.*\\.${extension}$`));
                    }).forEach(v => {
                        const outFile = multiElements[v].data.name;
                        // remove out file if exists
                        if (fs.existsSync(outFile)) fs.unlink(outFile, () => { });
                        multiElements[v].shut();
                        multiElements[v] = null;
                        Malta.log_debug(`${'REMOVED'.yellow()} ${folder}/${v}${NL}`);
                    });
                }, ext);
            }
        } else {
            ++processNum;
            proceed(key, el);
        }
    },
    proceed = (tpl, options) => {
        let i = 0,
            l;
        if (typeof options !== 'undefined' && options instanceof Array) {
            l = options.length;
            for (null; i < l; i++) proceed(tpl, options[i]);
        } else {
            options = options || '';
            let o = [tpl];

            o = o.concat(options.split(/\s/))
                .concat([`proc=${processNum}`]);
            return Malta.get().check(o).start();
        }
    },
    subCommand = command => {
        switch (command) {
            case '-clean':
                Malta.log('Removing all .buildNum.json files');
                spawn('find', ['.', '-name', '*.buildNum.json', '-type', 'f', '-delete']);
                Malta.log('... done');
                return true;
            default:
                Malta.log(`Command "${command}" not available`);
                return false;
        }
    };

module.exports = {
    multi,
    subCommand,
    proceed
};
