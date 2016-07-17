export const NODE_ENV = (() => {
    try {
        return global.require('electron').remote.process.env.NODE_ENV;
    } catch (e) {
        return 'production';
    }
})();

let LogLevel = 'info';

if (NODE_ENV === 'production') {
    LogLevel = 'warn';
} else if (NODE_ENV === 'debug') {
    LogLevel = 'debug';
}

import log = require('loglevel');
log.setLevel(LogLevel);
export default log;
