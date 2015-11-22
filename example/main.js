var path = require('path');
var app = require('app');
var BrowserWindow = require('browser-window');

var index_html = 'file://' + path.join(__dirname, 'index.html');

app.on('ready', function() {
    var win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    win.on('closed', function() {
        win = null;
        app.quit();
    });

    win.loadUrl(index_html);
    win.openDevTools({detach: true});
});
