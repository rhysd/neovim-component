global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom');
const document = new jsdom.JSDOM().window.document;
const ScreenWheel = require('../../src/out/neovim/screen-wheel').default;
const NeovimStore = require('../../src/out/neovim/store').default;


function wheelEvent(x, y, opts) {
    var e = document.createEvent('UIEvents');
    e.initEvent('wheel', true, false);
    if (opts) {
        for (var k in opts) {
            e[k] = opts[k];
        }
    }
    e.deltaX = x;
    e.deltaY = y;
    return e;
}

describe('ScreenWheel', () => {
    var store = null;

    beforeEach(() => {
        store = new NeovimStore();
    });

    afterEach(() => {
        store = null;
    });

    describe('#handleEvent()', () => {
        it('outputs empty input when no wheel event', () => {
            const w = new ScreenWheel(store);
            for (var i = 0; i < 10; ++i) {
                const input_to_neovim = w.handleEvent(wheelEvent(0, 0));
                assert.equal(input_to_neovim, '');
            }
        });

        it('makes key sequence from scroll down wheel events', () => {
            const w = new ScreenWheel(store);
            const input_to_neovim = w.handleEvent(wheelEvent(0, 100));
            assert.include(input_to_neovim, '<ScrollWheelDown>');
        });

        it('makes key sequence from scroll up wheel events', () => {
            const w = new ScreenWheel(store);
            const input_to_neovim = w.handleEvent(wheelEvent(0, -100));
            assert.include(input_to_neovim, '<ScrollWheelUp>');
        });

        it('makes key sequence from scroll left wheel events', () => {
            const w = new ScreenWheel(store);
            const input_to_neovim = w.handleEvent(wheelEvent(100, 0));
            assert.include(input_to_neovim, '<ScrollWheelLeft>');
        });

        it('makes key sequence from scroll right wheel events', () => {
            const w = new ScreenWheel(store);
            const input_to_neovim = w.handleEvent(wheelEvent(-100, 0));
            assert.include(input_to_neovim, '<ScrollWheelRight>');
        });

        it('accumulates amounts of scrolling', () => {
            const w = new ScreenWheel(store);
            var input_to_neovim = w.handleEvent(wheelEvent(2, 0));
            assert.equal(input_to_neovim, '');
            input_to_neovim = w.handleEvent(wheelEvent(4, 0));
            assert.notEqual(input_to_neovim, '');
        });

        it('respects Ctrl and Shift modifier key', () => {
            var w, input_to_neovim;

            w = new ScreenWheel(store);
            input_to_neovim = w.handleEvent(wheelEvent(0, 100, { ctrlKey: true }));
            assert.include(input_to_neovim, '<C-ScrollWheelDown>');

            w = new ScreenWheel(store);
            input_to_neovim = w.handleEvent(wheelEvent(0, 100, { shiftKey: true }));
            assert.include(input_to_neovim, '<S-ScrollWheelDown>');

            w = new ScreenWheel(store);
            input_to_neovim = w.handleEvent(wheelEvent(0, 100, { shiftKey: true, ctrlKey: true }));
            assert.include(input_to_neovim, '<C-S-ScrollWheelDown>');
        });

        it('resets amounts of scrolling when modifier key is changed', () => {
            const w = new ScreenWheel(store);
            var input_to_neovim = w.handleEvent(wheelEvent(0, 1, { ctrlKey: true }));
            assert.equal(input_to_neovim, '');
            input_to_neovim = w.handleEvent(wheelEvent(0, 1, { shiftKey: true }));
            assert.equal(input_to_neovim, '');
            input_to_neovim = w.handleEvent(wheelEvent(0, 2, { shiftKey: true }));
            assert.notEqual(input_to_neovim, '');
        });
    });
});
