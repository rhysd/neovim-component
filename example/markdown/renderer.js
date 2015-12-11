(function(){
    'use strict';

    const electron = require('electron');
    const remote = electron.remote;
    const shell = electron.shell;
    const editor = document.getElementById('neovim').editor;
    const mdviewer = document.getElementById('markdown-viewer');

    editor.on('process-attached', function() {
        if (remote.process.argv.length > 2) {
            editor.setArgv(remote.process.argv.slice(2)); // It is better to use 'argv' property.
        }
        const c = editor.getClient();
        c.command('setf markdown');
        c.command('autocmd TextChanged,TextChangedI * if &ft ==# "markdown" | call rpcnotify(0, "markdown-viewer:text-update", join(getline(1, "$"), "\\n")) | endif');
        c.subscribe('markdown-viewer:text-update');
        c.on('notification', function(method, args) {
            if (method === 'markdown-viewer:text-update' &&
                args.length > 0 &&
                typeof args[0] === 'string') {
                console.log(args[0]);
                mdviewer.innerHTML = marked(args[0]);
            }
        });
    });
    editor.on('quit', function() {
        remote.require('app').quit();
    });

    editor.store.on('beep', function() {
        shell.beep();
    });
    editor.store.on('title-changed', function() {
        document.title = editor.store.title;
    });
    editor.store.on('icon-changed', function() {
        var icon = editor.store.icon_path;
        if (icon === '') {
            return;
        }
        if (process.platform === 'darwin') {
            remote.getCurrentWindow().setRepresentedFilename(icon);
        }
    });

    window.addEventListener('resize', function() {
        editor.screen.resizeWithPixels(window.innerWidth, window.innerHeight);
    });

})();
