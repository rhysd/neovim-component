var path = require('path');
var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;

var index_html = 'file://' + path.join(__dirname, 'index.html');

app.on('ready', function() {
    var win = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        webPreferences: {
            blinkFeatures: 'KeyboardEventKey'
        }
    });

    win.on('closed', function() {
        win = null;
        app.quit();
    });

    win.loadURL(index_html);
    if (process.env['NODE_ENV'] !== 'production') {
        win.webContents.openDevTools({detach: true});
    }
});
