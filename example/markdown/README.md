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
