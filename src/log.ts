import log = require('loglevel');

export const NODE_ENV = (() => {
    try {
        return global.require('electron').remote.process.env.NODE_ENV || 'production';
    } catch (e) {
        return 'production';
    }
})();

if (NODE_ENV === 'production') {
    log.setLevel('WARN');
} else if (NODE_ENV === 'debug') {
    log.setLevel('DEBUG');
} else {
    log.setLevel('INFO');
}

export default log;
