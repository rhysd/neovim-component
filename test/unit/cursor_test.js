global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom');
const NeovimStore = require('../../src/out/neovim/store').default;
const Cursor = require('../../src/out/neovim/cursor').default;
const A = require('../../src/out/neovim/actions');

describe('Cursor', () => {
    beforeEach(() => {
        /* global document */
        global.document = new jsdom.JSDOM(`
            <body>
                <canvas class="neovim-screen"></canvas>
                <canvas class="neovim-cursor"></canvas>
                <input class="neovim-input"/>
            </body>
        `).window.document;
        /* global store */
        global.store = new NeovimStore();
        store.font_attr.width = 7;
        store.font_attr.height = 14;
        store.font_attr.draw_width = 7;
        store.font_attr.draw_height = 14;
        store.cursor_draw_delay = 0;
        store.cursor_blink_interval = 100;
        /* global cursor */
        global.cursor = new Cursor(store, document.querySelector('.neovim-screen').getContext('2d'));
    });

    afterEach(() => {
        delete global.document;
        delete global.store;
        delete global.cursor;
    });

    it('initializes cursor element', () => {
        const e = cursor.element;
        assert.equal(e.style.top, '0px');
        assert.equal(e.style.left, '0px');
        assert.equal(e.style.width, '7px');
        assert.equal(e.style.height, '14px');
        assert.equal(e.width, 7);
        assert.equal(e.height, 14);
    });

    it('updates cursor size when font size is changed', () => {
        store.font_attr.width = 8;
        store.font_attr.height = 16;
        store.emit('font-size-changed');
        assert.equal(cursor.element.style.width, '8px');
        assert.equal(cursor.element.style.height, '16px');
    });

    it('moves cursor on cursor moving', () => {
        store.cursor = {
            line: 12,
            col: 24
        };
        store.emit('cursor');
        assert.equal(cursor.element.style.left, store.cursor.col * store.font_attr.width + 'px');
        assert.equal(cursor.element.style.top, store.cursor.line * store.font_attr.height + 'px');
    });

    context('on cursor blinking', () => {
        beforeEach(() => {
            global.store.dispatcher.dispatch(A.startBlinkCursor());
        });

        it('starts blink timer at start', () => {
            assert.isTrue(cursor.blink_timer.enabled, 'Blink timer did not start');
        });

        it('makes cursor blink actually', done => {
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.notEqual(flag, cursor.blink_timer.shown);
                flag = cursor.blink_timer.shown;
                setTimeout(() => {
                    assert.notEqual(flag, cursor.blink_timer.shown);
                    done();
                }, 110);
            }, 110);
        });

        it('stops blinking on cursor busy', done => {
            store.busy = true;
            store.emit('busy');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.equal(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it('restore cursor after editor backs from busy state', done => {
            store.busy = true;
            store.emit('busy');
            store.busy = false;
            store.emit('busy');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.notEqual(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it('stops blinking on insert mode', done => {
            store.mode = 'insert';
            store.emit('mode');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.equal(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it('starts cursor blinking on normal mode again', done => {
            store.mode = 'insert';
            store.emit('mode');
            store.mode = 'normal';
            store.emit('mode');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.notEqual(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it('stop cursor blinking when focus lost', done => {
            store.focused = false;
            store.emit('focus-changed');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.equal(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it('starts cursor blinking again when focus gained', done => {
            store.focused = false;
            store.emit('focus-changed');
            store.focused = true;
            store.emit('focus-changed');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.notEqual(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });

        it("stops cursor blinking after 'stopBlinkCursor' action", done => {
            store.blink_cursor = false;
            store.emit('blink-cursor-stopped');
            var flag = cursor.blink_timer.shown;
            setTimeout(() => {
                assert.equal(flag, cursor.blink_timer.shown);
                done();
            }, 110);
        });
    });
});

