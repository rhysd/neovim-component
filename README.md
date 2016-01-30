`<neovim-editor>` Web Component
===============================
[![Build Status](https://api.travis-ci.org/rhysd/neovim-component.svg)](https://travis-ci.org/rhysd/neovim-component)

This component provides `<neovim-editor>` HTML custom element built on [Polymer](https://github.com/Polymer/polymer) and [flux](https://github.com/facebook/flux).
It provides a frontend of [Neovim editor](https://github.com/neovim/neovim) using Neovim's MessagePack API and you can embed Neovim editor easily to your application.

**This component assumes the environment where Node.js is integrated.**
So you can use this component for modern desktop application frameworks such as [Electron](https://github.com/atom/electron) or [NW.js](https://github.com/nwjs/nw.js).  (Or even useful for plugin of Electron-based editors such as [Atom](http://atom.io/) or [VS Code](https://github.com/Microsoft/vscode))

This component is designed with [Flux architecture](https://facebook.github.io/flux/docs/overview.html).
You can access the UI event notifications and can call Neovim APIs directly via `<neovim-editor>`'s APIs.

You can install this component as [npm package](https://www.npmjs.com/package/neovim-component).

```
$ npm install neovim-component
```


## Examples

Each example is implemented within 100~300 lines.

### [Minimal Example](/example/minimal)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="/path/to/webcomponents-lite.min.js"></script>
    <link rel="import" href="/path/to/polymer.html" />
    <link rel="import" href="/path/to/neovim-editor.html" />
  </head>
  <body>
    <neovim-editor></neovim-editor>
  </body>
</html>
```

Minimal [Electron](https://github.com/atom/electron) app in [example directory](/example/minimal).

![main screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/main.gif)


`neovim-component` package also has an example executable.

```sh
$ npm install -g neovim-component electron-prebuilt
$ simple-neovim-gui
```

### [Markdown Editor Example](/example/markdown)

If you want to see the more complicated and practical composable example, see [markdown editor example](/example/markdown).  Markdown previewer is integrated to Neovim GUI using `<neovim-editor>` component.

![markdown example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/markdown-example.gif)

### [Image Popup Example](/example/image-popup)

This is an image popup widget example [here](/example/image-popup).  `gi` mapping is defined to show an image under the cursor in popup tooltip.

![image popup example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/popup-image-example.gif)

### [Mini Browser Example](/example/mini-browser)

This is an embedded mini browser example implemented with [`<webview>` tag of Electron](https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md).

![mini browser example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/mini-browser.gif)


## Why You Created This?

Vim has very powerful features for editing.  But Vim is an editor (see `:help design-not`).  But there are many graphical features for writers and coders.  I want to support them without loosing Vim's powerful text editing.  So I thought it is good to support them in GUI layer by HTML and CSS and created this using [Neovim's msgpack APIs](https://neovim.io/doc/user/msgpack_rpc.html).  I'm creating [a new GUI frontend, NyaoVim](https://github.com/rhysd/NyaoVim) for proof of concept.


## Architecture

![data flow](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/flow.png)

`<neovim-editor>` has a property `editor` to access the internal APIs of the component.

- `editor.screen` is a view of this component (using canvas).  It receives user input and dispatches input action to store.
- `editor.process` is a process handler to interact with Neovim process via msgpack-rpc APIs.  You can call Neovim's APIs via Neovim client (`editor.getClient()` helper).
- `editor.store` is a state of this component.  You can access the current state via this object.


## `<neovim-editor>` Properties

You can customize `<neovim-editor>` with its properties.

| Name          | Description                           | Default       |
| ------------- | ------------------------------------- | ------------- |
| `width`       | Width of editor in pixel.             | `null`        |
| `height`      | Height of editor in pixel.            | `null`        |
| `font`        | Face name of font.                    | `"monospace"` |
| `font-size`   | Font size in pixel.                   | `12`          |
| `line-height` | Line height rate against font size.   | `1.3`         |
| `nvim-cmd`    | Command to start Neovim.              | `"nvim"`      |
| `argv`        | Arguments passed to Neovim command.   | `[]`          |
| `on-quit`     | Callback function on Neovim quitting. | `null`        |
| `on-error`    | Callback function on error in Neovim. | `null`        |


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
You can see the all API definitions [here](https://github.com/rhysd/promised-neovim-client/blob/promisified/index.d.ts).  If you know further about Neovim APIs, [python client implementation](https://github.com/neovim/python-client) may be helpful.

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

// Called when internal process causes some errors
neovim_element.editor.on('error', err => alert(err.message));
```


### View APIs

- Resize screen

```javascript
const editor = document.getElementById('neovim').editor;
editor.screen.resize(80, 100); // Resize screen to 80 lines and 100 columns
editor.screen.resizeWithPixels(1920, 1080); // Resize screen to 1920x1080px
```

- Change font size

```javascript
const editor = document.getElementById('neovim').editor;
editor.screen.changeFontSize(18); // Change font size to 18px
```

- Convert pixels to lines/cols.

```javascript
const editor = document.getElementById('neovim').editor;

const loc = editor.screen.convertPositionToLocation(80, 24);
console.log(loc.x, loc.y);  // Coordinates in pixels of (line, col) = (80, 24)

const pos = editor.screen.convertLocationToPosition(400, 300);
const.log(pos.col, pos.line);  // line/col of location (400px, 300px)
```

- Notify screen should resize

When some process may change screen size, **you must notify it to screen**.  This is because screen has `<canvas>` element and it must have fixed size.  Screen must always know the size of screen by calling `screen.checkShouldResize()`.
Note that you need not care about `resize` event of `<body>` element.  `<neovim-editor>` component automatically detects the resize event and update screen size.  And it is OK to call `screen.checkShouldResize()` if screen is not actually resized.  If screen isn't resized, `screen.checkShouldResize()` simply ignores the call.

```javascript
const editor = document.getElementById('neovim').editor;

function showUpSomeElementInNeovim() {
    const e = document.getElementById('some-elem');

    // Element shows up!  Screen may be resized by the change.
    // 'none' -> 'block'
    e.style.display = 'block';

    // You need to call this to say to <neovim-editor> that 'You may be resized.  Check it out!'.
    editor.screen.checkShouldResize();
}
```

### Other APIs

- Set arguments after

If your app doesn't use Polymer, you can set arguments as below after.
Note that it is better to use `argv` property of `<neovim-element>`.

```javascript
const editor = document.getElementById('neovim').editor;
editor.setArgv(['README.md']);
```

- Focus on editor

`<neovim-editor>` is just one of component in browser.  So it has focus like as other elements.  If focus is lost, editor can't take input event. `editor` instance has a method to focus on editor in JavaScript and `store` instance contains the focus state.

```javascript
const editor = document.getElementById('neovim').editor;
console.log(editor.store.focused);
editor.store.on('focus-changed', () => {
    console.log('Focus was changed: ' + editor.store.focused);
});

// Focus on Neovim screen to ensure that user can input.
editor.focus();
```

### Log Levels

`<neovim-component>` prints logs in browser console.  The log level is controlled by environment variable `NODE_ENV`.

- `NODE_ENV=debug` enables all logs.
- `NODE_ENV=production` disables all logs except for warnings and errors.
- Setting empty string or other value to `NODE_ENV` enable info log, warnings, and errors.


## TODOs

- [ ] WebGL rendering (using [pixi.js](http://www.pixijs.com/) or [CreateJS](http://www.createjs.com/)). See #2.

