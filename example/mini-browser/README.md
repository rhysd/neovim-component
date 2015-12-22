Mini Browser Example
====================

This is an embedded mini browser example of [<neovim-editor> component](https://github.com/rhysd/neovim-component).

![screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/mini-browser.gif)

`:Browse {url}` command opens embedded mobile browser as screenshot.  You can see the document page, issue page, and so on quickly.  This embedded browser is implemented with [`<webview>` tag of Electron](https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md).

You can execute this example by below commands.

```sh
$ cd /path/to/neovim-component
$ npm run dep
$ cd ./example/mini-browser
$ npm run app
```

I created very simple webview wrapper as `<mini-browser>` component.  It works with `<neovim-editor>` component and Neovim process.  When user inputs command, the url is sent by `rpcnotify()` and `<neovim-editor>` forwards it to `<mini-browser>` component.  `<mini-browser>` component is separated and reusable for Electron apps.
