const os = require('os'),
    childProcess = require('child_process'),
    platform = os.platform(),
    // Basso,Blow,Bottle,Frog,Funk,Glass,Hero,Morse,Ping,Pop,Purr,Sosumi,Submarine,Tink
    sounds = { success: 'Tink', failure: 'Blow' },
    icons = { success: '✅', failure: '❌' },
    tools = {
        mac: [
            'osascript',
            '-e \'display notification "{icon} {message}" with title "{title}"{sound}\''
        ],
        linux: [
            'notify-send',
            '-t 1000 "{title}" "{message}"'
        ]
    },
    currentOs = (function () {
        if (/^win32/.test(platform)) return 'win';
        if (/^linux/.test(platform)) return 'linux';
        if (/^darwin/.test(platform)) return 'mac';
        return false;
    })();

module.exports = (title, message, errs, testcb) => {
    if (typeof testcb === 'undefined') {
        testcb = () => null;
    }
    if (!(currentOs in tools)) return;
    const exeData = tools[currentOs],
        hasErrors = typeof errs !== 'undefined',
        exec = exeData[0],
        params = exeData[1]
            .replace(/\{title\}/, title)
            .replace(/\{message\}/, message)
            .replace(/\{icon\}/, icons[hasErrors ? 'failure' : 'success'])
            .replace(/\{sound\}/, hasErrors ? `sound name "${sounds.failure}"` : '');
    setImmediate(() => {
        childProcess.exec(`which ${exec}`, error => {
            if (error === null) {
                childProcess.exec(`${exec} ${params}`, error => {
                    if (error) {
                        // eslint-disable-next-line no-console
                        console.log(error);
                    } else {
                        testcb(`${title}___${message}`);
                    }
                });
            }
        });
    });
};
