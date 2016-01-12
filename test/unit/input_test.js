global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom').jsdom;
const NeovimStore = require('../../src/out/neovim/store').default;
const NeovimInput = require('../../src/out/neovim/input').default;

function keydownEvent(opts) {
    const o = opts || {};
    if (o.keyCode) {
        o.charCode = o.which = o.keyCode;
        o.key = String.fromCharCode(o.keyCode);
    } else if (o.key) {
        o.keyCode = o.charCode = o.which = o.key.charCodeAt(0);
    } else {
        throw 'Invalid options for KeyboardEvent';
    }
    return new window.KeyboardEvent('keydown', o);
}

function dispatchKeydown(opts) {
    return global.input_element.dispatchEvent(keydownEvent(opts));
}

function inputByKeydown(opts) {
    global.last_input = '';
    dispatchKeydown(opts);
    const i = global.last_input;
    global.last_input = '';
    return i;
}

function dispatchInputEvent() {
    global.input_element.dispatchEvent(
        new window.Event('input', {
            bubbles: true,
            cancelable: false
        })
    );
}

function catchInputOnInputEvent(i) {
    global.last_input = '';
    global.input_element.value = i;
    dispatchInputEvent();
    const tmp = global.last_input;
    global.last_input = '';
    return tmp;
}

describe('NeovimInput', () => {
    before(() => {
        /* global document input_element window input last_input */
        global.document = jsdom('<body><input class="neovim-input"/></body>');
        global.input_element = document.querySelector('.neovim-input');
        input_element.value = '';
        global.window = document.defaultView;
        const s = new NeovimStore();
        /* eslint no-unused-vars:0 */
        global.input = new NeovimInput(s);
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
            global.last_input = '';

            dispatchKeydown({key: 'a'});
            assert.equal(last_input, '');

            dispatchKeydown({key: '['});
            assert.equal(last_input, '');

            dispatchKeydown({key: '3', shiftKey: true});
            assert.equal(last_input, '');
        });

        it('accepts input with ctrl key', () => {
            assert.equal(inputByKeydown({key: 'a', ctrlKey: true}), '<C-a>');
            assert.equal(inputByKeydown({key: '3', ctrlKey: true}), '<C-3>');
            assert.equal(inputByKeydown({key: '[', ctrlKey: true}), '<C-[>');
            assert.equal(inputByKeydown({key: '[', ctrlKey: true, shiftKey: true}), '<C-S-[>');
        });

        it('accepts input with alt key', () => {
            assert.equal(inputByKeydown({key: ',', altKey: true}), '<A-,>');
            // assert.equal(inputByKeydown('r', {altKey: true}), '<A-r>');
            assert.equal(inputByKeydown({key: '4', altKey: true}), '<A-4>');
            // assert.equal(inputByKeydown('.', {altKey: true, shiftKey: true}), '<A-S-.>');
        });

        it('accepts input with alt and ctrl key', () => {
            assert.equal(inputByKeydown({key: ',', altKey: true, ctrlKey: true}), '<C-A-,>');
            assert.equal(inputByKeydown({key: 'a', altKey: true, ctrlKey: true}), '<C-A-a>');
            assert.equal(inputByKeydown({key: 'a', altKey: true, ctrlKey: true, shiftKey: true}), '<C-A-S-a>');
        });

        it('accepts special keys', () => {
            assert.equal(inputByKeydown({keyCode: 9}), '<Tab>');
            assert.equal(inputByKeydown({keyCode: 9, altKey: true}), '<A-Tab>');
            assert.equal(inputByKeydown({keyCode: 9, ctrlKey: true, shiftKey: true}), '<C-S-Tab>');
            assert.equal(inputByKeydown({keyCode: 13}), '<CR>');
            assert.equal(inputByKeydown({keyCode: 13, altKey: true}), '<A-CR>');
            assert.equal(inputByKeydown({keyCode: 13, ctrlKey: true, shiftKey: true}), '<C-S-CR>');
            assert.equal(inputByKeydown({keyCode: 37}), '<Left>');
            assert.equal(inputByKeydown({keyCode: 37, altKey: true}), '<A-Left>');
            assert.equal(inputByKeydown({keyCode: 37, ctrlKey: true, shiftKey: true}), '<C-S-Left>');
            assert.equal(inputByKeydown({keyCode: 92}), '<Bslash>');
            assert.equal(inputByKeydown({keyCode: 92, altKey: true}), '<A-Bslash>');
            assert.equal(inputByKeydown({keyCode: 92, ctrlKey: true, shiftKey: true}), '<C-S-Bslash>');
            assert.equal(inputByKeydown({keyCode: 188, shiftKey: true}), '<LT>');
            assert.equal(inputByKeydown({keyCode: 188, ctrlKey: true, shiftKey: true}), '<C-LT>');
            assert.equal(inputByKeydown({keyCode: 188}), '');
        });
    });

    context("on 'input' event", () => {
        it('sends input character to Neovim', () => {
            assert.equal(catchInputOnInputEvent('a'), 'a');
            assert.equal(catchInputOnInputEvent('3'), '3');
            assert.equal(catchInputOnInputEvent(';'), ';');
            assert.equal(catchInputOnInputEvent('^'), '^');
        });

        it('clears value in <input>', () => {
            global.input_element.value = 'a';
            dispatchInputEvent();
            assert.equal(global.input_element.value, '');
        });
    });
});

