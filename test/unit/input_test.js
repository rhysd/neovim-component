global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom').jsdom;
const NeovimStore = require('../../src/out/neovim/store').default;
const NeovimInput = require('../../src/out/neovim/input').default;

// XXX
function keydown(char, opts) {
    const k = {
        type: 'keydown',
        preventDefault: function(){},
        stopPropagation: function(){},
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        char: char,
        cancelable: false,
        bubbles: true,
        view: window,
        repeat: false,
        target: global.input_element
    };
    if (opts) {
        for (var p in opts) {
            k[p] = opts[p];
        }
    }
    k.keyCode = k.code = k.charCode = k.char.charCodeAt(0);
    return k;
}

describe('NeovimInput', () => {
    before(() => {
        /* global document */
        global.document = jsdom('<body><input class="neovim-input"/></body>');
        /* global input_element */
        global.input_element = document.querySelector('.neovim-input');
        input_element.value = '';
        /* global window */
        global.window = document.defaultView;
        const s = new NeovimStore();
        /* global input */
        global.input = new NeovimInput(s);
        /* global last_input */
        global.last_input = '';
        s.on('input', i => {
            global.last_input = i;
        });
    });

    after(() => {
        delete global.document;
        delete global.window;
        delete global.input;
        delete global.input_element;
    });

    it('focuses on an input element on initialization', () => {
        assert.equal(document.activeElement.className, 'neovim-input');
    });

    context("on 'keydown' event", () => {
        it('ignores normal char input without modifiers', () => {
            var k;
            k = keydown('a');
            input.onInsertControlChar(k);
            assert.equal(last_input, '');
            k = keydown('[');
            input.onInsertControlChar(k);
            assert.equal(last_input, '');
            k = keydown('3', {
                shiftKey: true
            });
            input.onInsertControlChar(k);
            assert.equal(last_input, '');
        });
    });
});

