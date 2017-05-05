global.require = require;
const assert = require('chai').assert;
const jsdom = require('jsdom');
const document = new jsdom.JSDOM().window.document;
const ScreenDrag = require('../../src/out/neovim/screen-drag').default;
const NeovimStore = require('../../src/out/neovim/store').default;

function eventFactory(kind) {
    return function (opts) {
        var e = document.createEvent('UIEvents');
        e.initEvent('mouse' + kind, true, false);
        if (opts) {
            for (var k in opts) {
                e[k] = opts[k];
            }
        }
        return e;
    };
}

describe('ScreenDrag', () => {
    const mousedown = eventFactory('down');
    const mousemove = eventFactory('move');
    const mouseup = eventFactory('up');

    describe('#start()', () => {
        const store = new NeovimStore();
        store.font_attr.height = 14;
        store.font_attr.width = 7;

        it('generates input to Neovim from left button mousedown event', () => {
            const d = new ScreenDrag(store);
            const e = mousedown({
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                clientX: 70,
                clientY: 140,
                button: 0
            });
            assert.equal(d.start(e), '<LeftMouse><10,10>');
        });

        it('generates input to Neovim from middle button mousedown event', () => {
            const d = new ScreenDrag(store);
            const e = mousedown({
                ctrlKey: true,
                altKey: false,
                shiftKey: true,
                clientX: 70,
                clientY: 140,
                button: 1
            });
            assert.equal(d.start(e), '<C-S-MiddleMouse><10,10>');
        });

        it('generates input to Neovim from right button mousedown event', () => {
            const d = new ScreenDrag(store);
            const e = mousedown({
                ctrlKey: true,
                altKey: true,
                shiftKey: false,
                clientX: 0,
                clientY: 0,
                button: 2
            });
            assert.equal(d.start(e), '<C-A-RightMouse><0,0>');
        });
    });

    describe('#drag()', () => {
        const store = new NeovimStore();
        store.font_attr.height = 14;
        store.font_attr.width = 7;
        const down = mousedown();

        it('generates input to Neovim from left button mousemove event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mousemove({
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                clientX: 70,
                clientY: 140,
                button: 0
            });
            assert.equal(d.drag(e), '<LeftDrag><10,10>');
        });

        it('generates input to Neovim from middle button mousemove event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mousemove({
                ctrlKey: true,
                altKey: false,
                shiftKey: true,
                clientX: 140,
                clientY: 280,
                button: 1
            });
            assert.equal(d.drag(e), '<C-S-MiddleDrag><20,20>');
        });

        it('generates input to Neovim from right button mousemove event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mousemove({
                ctrlKey: true,
                altKey: true,
                shiftKey: false,
                clientX: 0,
                clientY: 0,
                button: 2
            });
            assert.equal(d.drag(e), '<C-A-RightDrag><0,0>');
        });

        it('returns empty input when coordinate is not changed', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mousemove({
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                clientX: 70,
                clientY: 140,
                button: 0
            });
            assert.isNotNull(d.drag(e), 'input is null even if event location is changed');
            assert.isNull(d.drag(e), 'input is NOT null even if event location is not changed from previous drag method call');
        });
    });

    describe('#end()', () => {
        const store = new NeovimStore();
        store.font_attr.height = 14;
        store.font_attr.width = 7;
        const down = mousedown();

        it('generates input to Neovim from left button mouseup event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mouseup({
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                clientX: 70,
                clientY: 140,
                button: 0
            });
            assert.equal(d.end(e), '<LeftRelease><10,10>');
        });

        it('generates input to Neovim from middle button mouseup event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mouseup({
                ctrlKey: true,
                altKey: false,
                shiftKey: true,
                clientX: 140,
                clientY: 280,
                button: 1
            });
            assert.equal(d.end(e), '<C-S-MiddleRelease><20,20>');
        });

        it('generates input to Neovim from right button mouseup event', () => {
            const d = new ScreenDrag(store);
            d.start(down);
            const e = mouseup({
                ctrlKey: true,
                altKey: true,
                shiftKey: false,
                clientX: 0,
                clientY: 0,
                button: 2
            });
            assert.equal(d.end(e), '<C-A-RightRelease><0,0>');
        });
    });
});
