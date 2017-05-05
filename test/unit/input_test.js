global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom');
const NeovimStore = require('../../src/out/neovim/store').default;
const NeovimInput = require('../../src/out/neovim/input').default;

(function(){
var window;

function keydownEvent(opts) {
    const o = opts || {};
    if (o.keyCode) {
        o.charCode = o.which = o.keyCode;
    } else if (o.key !== undefined) {
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
        global.document = new jsdom.JSDOM('<body><input class="neovim-input"/></body>').window.document;
        global.input_element = document.querySelector('.neovim-input');
        input_element.value = '';
        window = document.defaultView;
        const s = new NeovimStore();
        /* eslint no-unused-vars:0 */
        global.input = new NeovimInput(s);
        global.last_input = '';
        s.on('input', i => {
            global.last_input = i;
        });
    });

    beforeEach(() => {
        global.input.store.alt_key_disabled = false;
        global.input.store.meta_key_disabled = false;
    });

    after(() => {
        delete global.document;
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

            dispatchKeydown({key: 'あ'});
            assert.equal(last_input, '');
        });

        it('accepts input with ctrl key', () => {
            assert.equal(inputByKeydown({key: 'a', ctrlKey: true}), '<C-a>');
            assert.equal(inputByKeydown({key: 'o', ctrlKey: true}), '<C-o>');
            assert.equal(inputByKeydown({key: '3', ctrlKey: true}), '<C-3>');
        });

        it('accepts input with alt key', () => {
            assert.equal(inputByKeydown({key: ',', altKey: true}), '<A-,>');
            assert.equal(inputByKeydown({key: 'r', altKey: true}), '<A-r>');
            assert.equal(inputByKeydown({key: '4', altKey: true}), '<A-4>');
        });

        it('accepts input with alt+ctrl keys', () => {
            assert.equal(inputByKeydown({key: 'a', ctrlKey: true, altKey: true}), '<C-A-a>');  // Ctrl is included in \u0001
            assert.equal(inputByKeydown({key: 'o', ctrlKey: true, altKey: true}), '<C-A-o>');  // Ctrl is included in \u000f
        });

        it('accepts input with command keys', () => {
            assert.equal(inputByKeydown({key: 'a', metaKey: true}), '<D-a>');
            assert.equal(inputByKeydown({key: 'a', metaKey: true, ctrlKey: true}), '<C-D-a>');
            assert.equal(inputByKeydown({key: 'a', metaKey: true, shiftKey: true}), '<D-S-a>');
        });

        it('accepts special keys', () => {
            assert.equal(inputByKeydown({key: 'Tab'}), '<Tab>');
            assert.equal(inputByKeydown({key: 'Tab', altKey: true}), '<A-Tab>');
            assert.equal(inputByKeydown({key: 'Tab', ctrlKey: true, shiftKey: true}), '<C-S-Tab>');
            assert.equal(inputByKeydown({key: 'Enter'}), '<CR>');
            assert.equal(inputByKeydown({key: 'Enter', altKey: true}), '<A-CR>');
            assert.equal(inputByKeydown({key: 'Enter', ctrlKey: true, shiftKey: true}), '<C-S-CR>');
            assert.equal(inputByKeydown({key: 'ArrowLeft'}), '<Left>');
            assert.equal(inputByKeydown({key: 'ArrowLeft', altKey: true}), '<A-Left>');
            assert.equal(inputByKeydown({key: 'ArrowLeft', ctrlKey: true, shiftKey: true}), '<C-S-Left>');
            assert.equal(inputByKeydown({key: '<', ctrlKey: true, shiftKey: true}), '<C-LT>');
            assert.equal(inputByKeydown({key: '<', altKey: true, shiftKey: true}), '<A-LT>');
            assert.equal(inputByKeydown({key: '\0'}), '<Nul>');
        });

        it('handles <CR>, <Esc>, <BS> and <C-m>, <C-[>, <C-h> edge cases', () => {
            assert.equal(inputByKeydown({key: 'Enter', keyCode: 13}), '<CR>');
            assert.equal(inputByKeydown({key: 'Enter', keyCode: 77, ctrlKey: true}), '<C-m>');
            assert.equal(inputByKeydown({key: 'Enter', keyCode: 13, ctrlKey: true}), '<C-CR>');

            assert.equal(inputByKeydown({key: 'Escape', keyCode: 27}), '<Esc>');
            assert.equal(inputByKeydown({key: 'Escape', keyCode: 219, ctrlKey: true}), '<C-[>');
            assert.equal(inputByKeydown({key: 'Escape', keyCode: 27, ctrlKey: true}), '<C-Esc>');

            assert.equal(inputByKeydown({key: 'Backspace', keyCode: 8}), '<BS>');
            assert.equal(inputByKeydown({key: 'Backspace', keyCode: 72, ctrlKey: true}), '<C-h>');
            assert.equal(inputByKeydown({key: 'Backspace', keyCode: 8, ctrlKey: true}), '<C-BS>');

            assert.equal(inputByKeydown({key: 'Tab', keyCode: 9}), '<Tab>');
            assert.equal(inputByKeydown({key: 'Tab', keyCode: 73, ctrlKey: true}), '<C-i>');
            assert.equal(inputByKeydown({key: 'Tab', keyCode: 9, ctrlKey: true}), '<C-Tab>');
        });

        it('replaces some special Ctrl+Shift characters following gVim behavior (issue #87)', () => {
            assert.equal(inputByKeydown({key: '2', keyCode: 50, ctrlKey: true}), '<C-@>');
            assert.equal(inputByKeydown({key: '6', keyCode: 54, ctrlKey: true}), '<C-^>');
            assert.equal(inputByKeydown({key: '-', keyCode: 189, ctrlKey: true}), '<C-_>');
        });

        it("handles ' ' edge case", () => {
            assert.equal(inputByKeydown({key: ' ', keyCode: 32}), '<Space>');
            assert.equal(inputByKeydown({key: ' ', keyCode: 32, ctrlKey: true}), '<C-Space>');
            assert.equal(inputByKeydown({key: ' ', keyCode: 32, shiftKey: true}), '<S-Space>');
        });

        context('when alt key is disabled', () => {
            it('ignores event.altKey', () => {
                global.input.store.alt_key_disabled = true;
                global.last_input = '';

                dispatchKeydown({key: 'a', altKey: true});
                assert.equal(last_input, 'a');

                assert.equal(inputByKeydown({key: 'a', altKey: true, ctrlKey: true}), '<C-a>');
                assert.equal(inputByKeydown({key: 'o', altKey: true, shiftKey: true, ctrlKey: true}), '<C-S-o>');
            });

            it('does not ignore any other modifiers', () => {
                global.input.store.alt_key_disabled = true;
                global.last_input = '';

                dispatchKeydown({key: 'a'});
                assert.equal(last_input, '');

                assert.equal(inputByKeydown({key: 'a', ctrlKey: true}), '<C-a>');
                assert.equal(inputByKeydown({key: 'o', ctrlKey: true, shiftKey: true}), '<C-S-o>');
            });
        });

        context('when meta key is disabled', () => {
            it('ignores event.metaKey', () => {
                global.input.store.meta_key_disabled = true;
                global.last_input = '';

                dispatchKeydown({key: 'a', metaKey: true});
                assert.equal(last_input, '');
                dispatchKeydown({key: 'a', altKey: true, shiftKey: true, ctrlKey: true, metaKey: true});
                assert.equal(last_input, '');
            });

            it('does not ignore any other modifiers', () => {
                global.input.store.meta_key_disabled = true;
                global.last_input = '';

                dispatchKeydown({key: 'a'});
                assert.equal(last_input, '');

                assert.equal(inputByKeydown({key: 'Enter', ctrlKey: true}), '<C-CR>');
                assert.equal(inputByKeydown({key: 'o', altKey: true, ctrlKey: true, shiftKey: true}), '<C-A-S-o>');
            });
        });

        context('when shift key is pressed', () => {
            it('considers shift key on alphabetical key input', () => {
                assert.equal(inputByKeydown({key: 'a', shiftKey: true, ctrlKey: true}), '<C-S-a>');
                assert.equal(inputByKeydown({key: 'P', shiftKey: true, ctrlKey: true}), '<C-S-P>');
                assert.equal(inputByKeydown({key: 'q', shiftKey: true, altKey: true}), '<A-S-q>');
            });

            it('does not consider shift key on non-slphabetical key input', () => {
                assert.equal(inputByKeydown({key: '@', shiftKey: true, ctrlKey: true}), '<C-@>');
                assert.equal(inputByKeydown({key: '{', shiftKey: true, ctrlKey: true}), '<C-{>');
                assert.equal(inputByKeydown({key: ']', shiftKey: true, ctrlKey: true}), '<C-]>');
            });
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

        it("handles '<' edge case", () => {
            assert.equal(catchInputOnInputEvent('<'), '<LT>');
        });
    });

    context("on focus events", () => {
        it('emits <FocusGained> on focused', () => {
            const e = new window.Event('focus', {
                bubbles: true,
                cancelable: false
            });
            global.input_element.dispatchEvent(e);
            assert.equal(global.last_input, '<FocusGained>');
        });

        it('emits <FocusLost> on focused', () => {
            const e = new window.Event('blur', {
                bubbles: true,
                cancelable: false
            });
            global.input_element.dispatchEvent(e);
            assert.equal(global.last_input, '<FocusLost>');
        });
    });

    it('moves <input> element following cursor', () => {
        const store = input.store;
        store.cursor = {
            line: 12,
            col: 24
        };
        store.font_attr.width = 4;
        store.font_attr.height = 8;

        store.emit('cursor');
        assert.equal(input_element.style.left, store.cursor.col * store.font_attr.width + 'px');
        assert.equal(input_element.style.top, store.cursor.line * store.font_attr.height + 'px');
    });
});
})();
