global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom').jsdom;
const NeovimStore = require('../../src/out/neovim/store').default;
const Cursor = require('../../src/out/neovim/cursor').default;

describe('Cursor', () => {
    beforeEach(() => {
        /* global document */
        global.document = jsdom(`
            <body>
                <canvas class="neovim-screen"></canvas>
                <canvas class="neovim-cursor"></canvas>
                <input class="neovim-input"/>
            </body>
        `);
        /* global store */
        global.store = new NeovimStore();
        store.font_attr.width = 7;
        store.font_attr.height = 14;
        store.font_attr.draw_width = 7;
        store.font_attr.draw_height = 14;
        store.cursor_draw_delay = 0;
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
});

