global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom').jsdom;
const NeovimStore = require('../../src/out/neovim/store').default;
const Cursor = require('../../src/out/neovim/cursor').default;

describe('Cursor', () => {
    beforeEach(() => {
        /* global document */
        global.document = jsdom('<body><div class="neovim-cursor"><input class="neovim-input"/></div></body>');
        /* global store */
        global.store = new NeovimStore();
        store.font_attr.width = 7;
        store.font_attr.height = 14;
        /* global cursor */
        global.cursor = new Cursor(store);
    });

    afterEach(() => {
        delete global.document;
        delete global.store;
        delete global.cursor;
    });

    it('initializes cursor element', () => {
        const e = cursor.element;
        assert.equal(e.style.borderColor, 'white');
        assert.equal(e.style.top, '0px');
        assert.equal(e.style.left, '0px');
        assert.equal(e.style.width, '7px');
        assert.equal(e.style.height, '14px');
        assert.isTrue(e.classList.contains(store.mode + '-mode'), 'mode class is not specified');
    });

    it('updates color when cursor foreground color is updated', () => {
        store.fg_color = 'blue';
        store.emit('update-fg');
        assert.equal(cursor.element.style.borderColor, 'blue');
    });

    it('updates cursor size when font size is changed', () => {
        store.font_attr.width = 8;
        store.font_attr.height = 16;
        store.emit('font-size-changed');
        assert.equal(cursor.element.style.width, '8px');
        assert.equal(cursor.element.style.height, '16px');
    });

    it('sets its width to charactor width on normal mode', () => {
        store.mode = 'normal';
        store.emit('mode');
        assert.equal(cursor.element.style.width, store.font_attr.width + 'px');
    });

    it('sets its width to 1px on normal mode', () => {
        store.mode = 'insert';
        store.emit('mode');
        assert.equal(cursor.element.style.width, '1px');
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

    it('sets "{mode}-mode" class to cursor on mode change', () => {
        store.mode = 'normal';
        store.emit('mode');
        assert.isTrue(cursor.element.classList.contains('normal-mode'), '".normal-mode" is not specified on normal mode');
        assert.isFalse(cursor.element.classList.contains('insert-mode'), '".insert-mode" is specified on normal mode');

        store.mode = 'insert';
        store.emit('mode');
        assert.isTrue(cursor.element.classList.contains('insert-mode'), '".insert-mode" is not specified on insert mode');
        assert.isFalse(cursor.element.classList.contains('normal-mode'), '".normal-mode" is specified on insert mode');
    });
});

