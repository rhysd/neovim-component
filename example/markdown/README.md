Markdown Editor Example
=======================

This is a markdown editor example of [<neovim-editor> component](https://github.com/rhysd/neovim-component).

![screenshot](https://raw.githubusercontent.com/rhysd/ss/master/neovim-component/markdown-example.gif)

Preview is updated at `TextChanged` and `TextChangedI` events.  Buffer content is sent from `<neovim-editor>` at the events and converted to HTML using [marked](https://github.com/chjj/marked) and displayed to viewer.  Math formula can also be rendered using [katex](https://github.com/Khan/KaTeX) and `katex` code block.

You can execute this by below commands.

```sh
$ cd /path/to/neovim-component
$ npm run dep
$ cd ./example/markdown
$ npm run dep
$ npm run app
```

When you change the buffer, `TextChanged` or `TextChangedI` is fired in Neovim and notifies it to the callback which is set in `index.html`.  The callback gets the buffer and sets it to `<markdown-viewer>` component.  Finally, `<markdown-viewer>` renders markdown preview.

It is important that `<markdown-viewer>` component doen't know about `<neovim-editor>` component at all but they work well together.  It means that now Neovim (= `<neovim-editor>` component) can work with so many WebComponents (e.g. [Polymer components](https://elements.polymer-project.org/)).
