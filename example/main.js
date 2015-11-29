var path = require('path');
var app = require('app');
var BrowserWindow = require('browser-window');

var index_html = 'file://' + path.join(__dirname, 'index.html');

app.on('ready', function() {
    var win = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
    });

    win.on('closed', function() {
        win = null;
        app.quit();
    });

    win.loadURL(index_html);
    if (process.env['NODE_ENV'] !== 'production') {
        win.openDevTools({detach: true});
    }
});
