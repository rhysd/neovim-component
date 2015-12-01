export const NODE_ENV = global.require('remote').process.env.NODE_ENV;

let LogLevel = 'info';

if (NODE_ENV === 'production') {
    LogLevel = 'warn';
} else if (NODE_ENV === 'debug') {
    LogLevel = 'debug';
}

import log = require('loglevel');
log.setLevel(LogLevel);
export default log;
