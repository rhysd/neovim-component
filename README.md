`<neovim-editor>` Web Component
===============================
[![Build Status](https://travis-ci.org/rhysd/neovim-component.svg?branch=master)](https://travis-ci.org/rhysd/neovim-component)


This component provides `<neovim-editor>`, an HTML custom element built on [Polymer v2](https://github.com/Polymer/polymer)
and [flux](https://github.com/facebook/flux).  It provides a frontend for the [Neovim editor](https://github.com/neovim/neovim)
using Neovim's MessagePack API. It allows you to easily embed a Neovim-backed editor into your application.

**This component assumes to be used in Node.js environment. (i.e. Electron)**

You can use this component for modern desktop application frameworks such as [Electron](https://github.com/atom/electron)
or [NW.js](https://github.com/nwjs/nw.js).  You can even use it in Electron-based editors such as [Atom](http://atom.io/)
or [VS Code](https://github.com/Microsoft/vscode).

This component is designed around the [Flux architecture](https://facebook.github.io/flux/docs/overview.html).
You can access the UI event notifications and can call Neovim APIs directly via `<neovim-editor>`'s
APIs.

You can install this component as an [npm package](https://www.npmjs.com/package/neovim-component).

```
$ npm install neovim-component
```

Current supported `nvim` version is v0.1.6 or later.


## Examples

Each example only takes 100~300 lines.

### [Minimal Example](/example/minimal)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="/path/to/webcomponents-lite.js"></script>
    <link rel="import" href="/path/to/polymer.html" />
    <link rel="import" href="/path/to/neovim-editor.html" />
  </head>
  <body>
    <neovim-editor></neovim-editor>
  </body>
</html>
```

Minimal [Electron](https://github.com/atom/electron) app can be found in the [example directory](/example/minimal).
This is a good start point to use this package and it shows how the component works.

![main screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/main.gif)

How to run minimal example is:

```sh
$ git clone https://github.com/rhysd/neovim-component.git
$ cd neovim-component
$ npm start
```

### [Markdown Editor Example](/example/markdown)

For a more complicated and realistic example, see the [markdown editor example](/example/markdown).
The markdown previewer is integrated with the Neovim GUI using the `<neovim-editor>` component.

![markdown example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/markdown-example.gif)

### [Image Popup Example](/example/image-popup)

This is an image popup widget example [here](/example/image-popup).  The `gi` mapping is defined
to show an image under the cursor in a tooltip.

![image popup example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/popup-image-example.gif)

### [Mini Browser Example](/example/mini-browser)

This example shows how to include a mini web-browser using the
[`<webview>` tag from Electron](https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md).

![mini browser example screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/mini-browser.gif)


## Why Did You Create This?

Vim has very powerful editing features, but Vim is an editor (see `:help design-not`) and unfortunately
lacks support for many graphical tools that writers and programmers like.  NyaoVim adds support for
graphical features without losing Vim's powerful text editing abilities.
[Neovim's msgpack APIs](https://neovim.io/doc/user/msgpack_rpc.html) provide a perfect way to add
a GUI layer using HTML and CSS.  [NyaoVim](https://github.com/rhysd/NyaoVim) is a GUI frontend as
a proof of concept.


## Architecture

![data flow](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/flow.png)

`<neovim-editor>` has an `editor` property to access the internal APIs of the component.

- `editor.screen` is a view of the component (using canvas).  It receives user input and dispatches
  input actions to the data store.
- `editor.process` is a process handler to interact with the backing Neovim process via msgpack-rpc
  APIs.  You can call Neovim's APIs via the Neovim client (`editor.getClient()` helper).
- `editor.store` is the state of this component.  You can access the current state of the editor through
  this object.


## `<neovim-editor>` Properties

You can customize `<neovim-editor>` with the following properties:

| Name                | Description                                | Default       |
| ------------------- | -------------------------------------------| ------------- |
| `width`             | Width of the editor in pixels.             | `null`        |
| `height`            | Height of the editor in pixels.            | `null`        |
| `font`              | Name of the editor's monospace font.       | `"monospace"` |
| `font-size`         | Font-size in pixels.                       | `12`          |
| `line-height`       | Line height rate relative to font size.    | `1.3`         |
| `nvim-cmd`          | Command used to start Neovim.              | `"nvim"`      |
| `argv`              | Arguments passed with the Neovim command.  | `[]`          |
| `on-quit`           | Callback function to run when Neovim quits.| `null`        |
| `on-error`          | Callback function for Neovim errors.       | `null`        |
| `disable-alt-key`   | Do not send alt key input to Neovim.       | `false`       |
| `disable-meta-key`  | Do not send meta key input to Neovim.      | `false`       |
| `cursor-draw-delay` | Delay in millisec before drawing cursor.   | `10`          |
| `no-blink-cursor`   | Blink cursor or not.                       | `false`       |
| `window-title`      | Specify first window title.                | `"Neovim"`    |


## `<neovim-editor>` APIs

### Receive internal various events

You can receive various events (including UI redraw notifications) from the **store**.
The `store` is a part of flux architecture. It's a global instance of [EventEmitter](https://nodejs.org/api/events.html).

You can also access the state of editor via the `store`. Note that all values are read only.
Do not change the values of the `store` directly, it will break the internal state of the component.

```javascript
const neovim_element = document.getElementById('neovim');
const Store = neovim_element.editor.store;

// Handle cursor movements
Store.on('cursor', () => console.log('Cursor is moved to ', Store.cursor));

// Handle mode changes
Store.on('mode', () => console.log('Mode is changed to ', Store.mode));

// Handle text redraws
Store.on('put', () => console.log('UI was redrawn'));

// Accessing the state of the editor.
const bounds = [ Store.size.lines, Store.size.cols ];
const cursor_pos = [ Store.cursor.line, Store.cursor.col ];
```


### Call Neovim APIs

You can call [Neovim APIs](https://neovim.io/doc/user/msgpack_rpc.html#msgpack-rpc-api) via the **client**.
When you call APIs via the client, it sends the call to the underlying Neovim process via MessagePack
RPC and will return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
which resolves to the returned value.


`<neovim-component>` uses [promised-neovim-client](https://github.com/rhysd/promised-neovim-client) package.
You can see the all API definitions [here](https://github.com/rhysd/promised-neovim-client/blob/promisified/index.d.ts).
If you know further about Neovim APIs, [python client implementation](https://github.com/neovim/python-client)
may be helpful.

```javascript
const neovim_element = document.getElementById('neovim');
const client = neovim_element.editor.getClient();

// Send a command
client.command('vsplit');

// Send input
client.input('<C-w><C-l>');

// Evaluate a Vim script expression
client.eval('"aaa" . "bbb"').then(result => console.log(result));

// Get the 'b:foo' variable
client.getCurrentBuffer()
    .then(buf => buf.getVar('foo'))
    .then(v => console.log(v));

// Query something (windows, buffers, etc.)
// Move to the neighbor window and show its information.
client.getWindows()
    .then(windows => client.secCurrentWindow(windows[1]))
    .then(() => client.getCurrentWindow())
    .then(win => console.log(win));

// Receive an RPC request from Neovim
client.on('request', (n, args, res) => console.log(`Name: ${n}, Args: ${JSON.stringify(args)}, Response: ${res}`));
```


### Editor lifecycle

You can receive notifications related to lifecycle of the editor.

```javascript
const neovim_element = document.getElementById('neovim');

// Called when the Neovim background process attaches
neovim_element.editor.on('process-attached', () => console.log('Neovim process is ready'));

// Called when the Neovim process is disconnected (usually by :quit)
neovim_element.editor.on('quit', () => console.log('Neovim process died'));

// Called when the <neovim-component> detaches
neovim_element.editor.on('detach', () => console.log('Element does not exist in DOM.'));

// Called upon experiencing an error in the internal process 
neovim_element.editor.on('error', err => alert(err.message));
```


### View APIs

- Resize screen

```javascript
const editor = document.getElementById('neovim').editor;
editor.screen.resize(80, 100); // Resize screen to 80 lines and 100 columns
editor.screen.resizeWithPixels(1920, 1080); // Resize screen to 1920px x 1080px
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

- Notify of screen-size changes:

When some process has changed the screen-size **you must notify the `screen`**. The internal `<canvas>`
element has a fixed size and must update itself if there are size changes.  Call `screen.checkShouldResize()`
if the screen size may have changed.  Note that you don't need to care about `resize` event of `<body>`
element.  `<neovim-editor>` component automatically detects this particular resize event and updates
automatically. `screen.checkShouldResize()` will simply be ignored if nothing has actually changed.

```javascript
const editor = document.getElementById('neovim').editor;

function showUpSomeElementInNeovim() {
    const e = document.getElementById('some-elem');

    // New element shows up!  The screen may be resized by the change.
    // 'none' -> 'block'
    e.style.display = 'block';

    // This call tells to editor to adjust itself in the case that it has been resized
    editor.screen.checkShouldResize();
}
```

### Other APIs

- Setting arguments afterwards:

If your app doesn't use Polymer you can set arguments afterwards using JavaScript
Note that it is better to use `argv` property of `<neovim-element>` if possible.

```javascript
const editor = document.getElementById('neovim').editor;
editor.setArgv(['README.md']);
```

- Focusing the editor

`<neovim-editor>` is just a web-component, so it can be focused just like other elements.  
If it loses focus the editor won't receive any input events. 
The `editor` instance has a method to re-focus the editor in JavaScript.
The `store` instance contains the current focus state.

```javascript
const editor = document.getElementById('neovim').editor;
console.log(editor.store.focused);
editor.store.on('focus-changed', () => {
    console.log('Focus was changed: ' + editor.store.focused);
});

// Refocus the editor to ensure it receives user input.
editor.focus();
```

### Log Levels

`<neovim-component>` prints logs in the browser console.  The log level is controlled by the `NODE_ENV`
environment variable:

- `NODE_ENV=debug` will log everything.
- `NODE_ENV=production` ignores all logs except for warnings and errors.
- Setting `NODE_ENV` to empty string or some other value enables logging for info, warnings, and errors.


## TODOs

- [ ] WebGL rendering (using [pixi.js](http://www.pixijs.com/) or [CreateJS](http://www.createjs.com/)).
  [#2](https://github.com/rhysd/neovim-component/issues/2)
- [ ] Follow dynamic device pixel ratio change. [#18](https://github.com/rhysd/neovim-component/issues/18)
