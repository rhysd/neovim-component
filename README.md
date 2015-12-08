`<neovim-editor>` Web Component
===============================

This component provides `<neovim-editor>` HTML custom element built on [Polymer](https://github.com/Polymer/polymer) and [flux](https://github.com/facebook/flux).
It provides a frontend of [Neovim editor](https://github.com/neovim/neovim) using Neovim's MessagePack API and you can embed Neovim editor easily to your application.

**This component assumes the environment where Node.js is integrated.**
So you can use this component for modern desktop application frameworks such as [Electron](https://github.com/atom/electron) or [NW.js](https://github.com/nwjs/nw.js).

This component is designed with [Flux architecture](https://facebook.github.io/flux/docs/overview.html).
You can access the UI event notifications and can call Neovim APIs directly via `<neovim-editor>`'s APIs.

You can install this component as [npm package](https://www.npmjs.com/package/neovim-component).

```
$ npm install neovim-component
```


## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="/path/to/webcomponents-lite.min.js"></script>
    <link rel="import" href="/path/to/neovim-editor.html" />
  </head>
  <body>
    <neovim-editor></neovim-editor>
  </body>
</html>
```

Please see the very simple [Electron](https://github.com/atom/electron) app in [example directory](/example).  You can start it easily with `rake` command.

![example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/neovim-component-linux.png)

`neovim-component` also has an example executable.

```sh
$ npm install neovim-component electron-prebuilt
$ simple-neovim-gui
```

## TODOs

This component is currently being developed.

- [x] Show UI
- [x] Highlight
- [x] Display cursor
- [x] Input to neovim
- [x] Resize (by pixel and by lines&columns)
- [x] Mouse/Scroll support (click, drag, wheel scroll)
- [ ] WebGL rendering (using [pixi.js](http://www.pixijs.com/) or [CreateJS](http://www.createjs.com/))
- [ ] Add API to convert pixel coordinate to line&column coordinate.
- [ ] Handle all UI events
  - [x] `bell`/`visual_bell`
  - [x] `mouse_on`/`mouse_off`
  - [ ] `scroll` (screen scroll on message from neovim)
  - [x] `set_icon`
  - [x] `set_title`
  - [x] `set_scroll_region`


## `<neovim-editor>` Properties

You can customize `<neovim-editor>` with its properties.

| Name        | Description                           | Default       |
| ----------- | ------------------------------------- | ------------- |
| `width`     | Width of editor in pixel.             | `800`         |
| `height`    | Height of editor in pixel.            | `600`         |
| `font`      | Face name of font.                    | `"monospace"` |
| `font-size` | Font size in pixel.                   | `12`          |
| `nvim-cmd`  | Command to start Neovim.              | `"nvim"`      |
| `argv`      | Arguments passed to Neovim command.   | `[]`          |
| `on-quit`   | Callback function on Neovim quitting. | `null`        |


## `<neovim-editor>` APIs

### Receive internal various events

You can receive various events (including UI redraw notifications) from **store**.
`store` is a part of flux architecture and global instance of [EventEmitter](https://nodejs.org/api/events.html).

You can also access to the state of editor via `store`. Note that all values are read only.
Do not change the value of store directly because it breaks the internal state of component.

```javascript
const neovim_element = document.getElementById('neovim');
const Store = neovim_element.editor.store;

// Receive the cursor moving.
Store.on('cursor', () => console.log('Cursor is moved to ', Store.cursor));

// Mode change
Store.on('mode', () => console.log('Mode is changed to ', Store.mode));

// Text is redrawn
Store.on('put', () => console.log('UI was redrawn'));

// You can also access to the state of editor.
const bounds = [ Store.size.lines, Store.size.cols ];
const cursor_pos = [ Store.cursor.line, Store.cursor.col ];
```


### Call Neovim APIs

You can call [Neovim APIs](https://neovim.io/doc/user/msgpack_rpc.html#msgpack-rpc-api) via **client**.
When you call some APIs via the client, it sends the call to underlying Neovim process via MessagePack RPC and will receive the returned value.
You can get the returned value from API as a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) value.

`<neovim-component>` uses [promised-neovim-client](https://github.com/rhysd/promised-neovim-client) package.
You can see the all API definitions [here](https://github.com/rhysd/promised-neovim-client/blob/promisified/index.d.ts).

```javascript
const neovim_element = document.getElementById('neovim');
const client = neovim_element.editor.getClient();

// Send command
client.command('vsplit');

// Send input
client.input('<C-w><C-l>');

// Evaluate Vim script expression
client.eval('"aaa" . "bbb"').then(result => console.log(result));

// Get b:foo variable
client.getCurrentBuffer()
    .then(buf => buf.getVar('foo'))
    .then(v => console.log(v));

// Query something (windows, buffers, and so on)
// Move to neighbor window and show the information of window.
client.getWindows()
    .then(windows => client.secCurrentWindow(windows[1]))
    .then(() => client.getCurrentWindow())
    .then(win => console.log(win));

// Receive RPC request from Neovim
client.on('request', (n, args, res) => console.log(`Name: ${n}, Args: ${JSON.stringify(args)}, Response: ${res}`));
```


### Editor lifecycle

You can receive notifications related to lifecycle of editor.

```javascript
const neovim_element = document.getElementById('neovim');

// Called on Neovim background process attached
neovim_element.editor.on('process-attached', () => console.log('Neovim process is ready'));

// Called on Neovim process is disconnected (usually by :quit)
neovim_element.editor.on('quit', () => console.log('Neovim process died'));

// Called when <neovim-component> is detached
neovim_element.editor.on('detach', () => console.log('Element does not exist in DOM.'));
```


### Other APIs

- Resize screen

```javascript
const editor = document.getElementById('neovim').editor;
editor.resizeScreen(1920, 1080); // Resize screen to 1920x1080px
editor.resizeView(80, 100); // Resize screen to 80 lines and 100 columns
```

- Change font size

```javascript
const editor = document.getElementById('neovim').editor;
editor.changeFontSize(18); // Change font size to 18px
```

- Set arguments after

If your app doesn't use Polymer, you can set arguments as below after.
Note that it is better to use `argv` property of `<neovim-element>`.

```javascript
const editor = document.getElementById('neovim').editor;
editor.setArgv(['README.md']);
```

### Log Levels

`<neovim-component>` prints logs in browser console.  The log level is controlled by environment variable `NODE_ENV`.

- `NODE_ENV=debug` enables all logs.
- `NODE_ENV=production` disables all logs except for warnings and errors.
- Setting empty string or other value to `NODE_ENV` enable info log, warnings, and errors.

