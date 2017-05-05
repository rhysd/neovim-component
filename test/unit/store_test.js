global.require = require;
global.window = global;
const assert = require('chai').assert;
const jsdom = require('jsdom');
const A = require('../../src/out/neovim/actions');
const NeovimStore = require('../../src/out/neovim/store').default;
const ScreenWheel = require('../../src/out/neovim/screen-wheel').default;
const document = new jsdom.JSDOM().window.document;

describe('NeovimStore', () => {
    context('initialization', () => {
        it('creates default state', () => {
            const s = new NeovimStore();
            assert.deepEqual(s.size, {
                lines: 0,
                cols: 0,
                width: 0,
                height: 0
            });
            assert.deepEqual(s.font_attr, {
                fg: 'white',
                bg: 'black',
                sp: null,
                bold: false,
                italic: false,
                underline: false,
                undercurl: false,
                draw_width: 1,
                draw_height: 1,
                width: 1,
                height: 1,
                specified_px: 1,
                face: 'monospace'
            });
            assert.deepEqual(s.cursor, {
                line: 0,
                col: 0
            });
            assert.equal(s.mode, 'normal');
            assert.isFalse(s.busy);
            assert.isTrue(s.mouse_enabled);
            assert.isNull(s.dragging);
            assert.equal(s.title, '');
            assert.equal(s.icon_path, '');
            assert.deepEqual(s.wheel_scrolling, new ScreenWheel(s));
            assert.deepEqual(s.scroll_region, {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            });
            assert.isTrue(s.focused);
            assert.equal(s.line_height, 1.2);
            assert.equal(s.alt_key_disabled, false);
            assert.equal(s.meta_key_disabled, false);
            assert.equal(s.cursor_draw_delay, 10);
            assert.equal(s.blink_cursor, false);
            assert.equal(s.cursor_blink_interval, 1000);
        });
    });

    context('on action received', () => {
        it('accepts input to neovim', () => {
            const s = new NeovimStore();
            s.on('input', i => {
                assert.equal(i, 'madaikeru');
            });
            s.dispatcher.dispatch(A.inputToNeovim('madaikeru'));
        });

        it('handles put event', () => {
            const s = new NeovimStore();
            s.on('put', text => {
                assert.equal(text, 'moudame');
            });
            var c = false;
            s.on('cursor', () => {
                c = true;
            });
            s.dispatcher.dispatch(A.putText('moudame'));
            assert.deepEqual(s.cursor, {
                col: 7,
                line: 0
            }, 'cursor did not move');
            assert.isTrue(c, 'cursor event was not fired');
        });

        it('handles cursor event', () => {
            const s = new NeovimStore();
            var c = false;
            s.on('cursor', () => {
                c = true;
            });
            s.dispatcher.dispatch(A.cursor(114, 514));
            assert.isTrue(c, 'cursor event was not fired');
            assert.deepEqual(s.cursor, {
                line: 114,
                col: 514
            });
        });

        it('handles highlight_set event', () => {
            const s = new NeovimStore();
            const hl1 = {
                background: 0xffffff,
                bg: 'white',
                bold: false,
                fg: 'black',
                special: 0x111111,
                foreground: 0x333333,
                italic: true,
                reverse: false,
                undercurl: true,
                underline: false
            };
            s.dispatcher.dispatch(A.highlight(hl1));
            var f = s.font_attr;
            assert.isFalse(f.bold, 'bold');
            assert.isTrue(f.italic, 'italic');
            assert.isTrue(f.undercurl, 'undercurl');
            assert.isFalse(f.underline, 'underline');
            assert.equal(f.bg, '#ffffff');
            assert.equal(f.fg, '#333333');
            assert.equal(f.sp, '#111111');

            const hl2 = {
                background: 0xffffff,
                foreground: 0x333333,
                reverse: true
            };
            s.dispatcher.dispatch(A.highlight(hl2));
            f = s.font_attr;
            assert.isUndefined(f.bold, 'bold');
            assert.isUndefined(f.italic, 'italic');
            assert.isUndefined(f.undercurl, 'undercurl');
            assert.isUndefined(f.underline, 'underline');
            assert.equal(f.bg, '#333333');
            assert.equal(f.fg, '#ffffff');
            assert.equal(f.fg, '#ffffff');
        });

        it('accespts notify-focus-changed action', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('focus-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.notifyFocusChanged(false));
            assert.isFalse(s.focused, 'focus did not change');
            assert.isTrue(flag, 'focus-changed event was not changed');

            s.dispatcher.dispatch(A.notifyFocusChanged(true));
            assert.isTrue(s.focused, 'focus did not change');
        });

        it('handles clear-eol event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('clear-eol', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.clearEndOfLine());
            assert.isTrue(flag, 'clear-eol event was not fired');
        });

        it('handles clear event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('clear-all', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.cursor(42, -42));
            s.dispatcher.dispatch(A.clearAll());
            assert.isTrue(flag, 'clear-all event was not fired');
            assert.deepEqual(s.cursor, {
                line: 0,
                col: 0
            });

            var flag2 = false;
            s.on('cursor', () => {
                flag2 = true;
            });
            s.dispatcher.dispatch(A.clearAll());
            assert.isTrue(flag2, 'cursor event was not fired');
        });

        it('accespts scroll screen action', () => {
            const s = new NeovimStore();
            var cols = 0;
            s.on('screen-scrolled', c => {
                cols = c;
            });
            s.dispatcher.dispatch(A.scrollScreen(42));
            assert.equal(cols, 42);
        });

        it('handles sroll_region event', () => {
            const s = new NeovimStore();
            const r = {
                top: 1,
                left: 2,
                right: 3,
                bottom: 4
            };
            var flag = false;
            s.on('scroll-region-updated', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.setScrollRegion(r));
            assert.isTrue(flag, 'scroll-region-updated event was not fired');
            assert.deepEqual(s.scroll_region, r);
        });

        it('handles resize event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('resize', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.resize(42, 84));
            assert.isTrue(flag, 'resize event was not fired');
            assert.equal(s.size.lines, 42, 'lines was not set');
            assert.equal(s.size.cols, 84, 'cols was not set');
            assert.deepEqual(s.scroll_region, {
                top: 0,
                left: 0,
                right: 83,
                bottom: 41
            });

            flag = false;
            s.dispatcher.dispatch(A.resize(42, 84));
            assert.isFalse(flag, 'resize event was wrongly fired');
        });

        it('handles update-fg event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('update-fg', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateForeground(0x123456));
            assert.isTrue(flag, 'update-fg event was not fired');
            assert.equal(s.fg_color, '#123456');
        });

        it('handles update-bg event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('update-bg', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateBackground(0x123456));
            assert.isTrue(flag, 'update-bg event was not fired');
            assert.equal(s.bg_color, '#123456');
        });

        it('handles update-sp event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('update-sp-color', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateSpecialColor(0x123456));
            assert.isTrue(flag, 'update-sp event was not fired');
            assert.equal(s.sp_color, '#123456');
        });

        it('handles mode event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('mode', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.changeMode('visual'));
            assert.isTrue(flag, 'mode event was not fired');
            assert.equal(s.mode, 'visual');
            s.dispatcher.dispatch(A.changeMode('select'));
            assert.equal(s.mode, 'select');
        });

        it('handles busy_start event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('busy', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.startBusy());
            assert.isTrue(flag, 'busy event was not fired');
            assert.isTrue(s.busy, 'unexpected busy state');
        });

        it('handles busy_end event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('busy', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.stopBusy());
            assert.isTrue(flag, 'busy event was not fired');
            assert.isFalse(s.busy, 'unexpected non-busy state');
        });

        it('accespts action to update font size', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('font-size-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateFontSize(42, 84, 21, 42));
            assert.isTrue(flag, 'font-size-changed event was not fired');
            const f = s.font_attr;
            assert.equal(f.draw_width, 42);
            assert.equal(f.draw_height, 84);
            assert.equal(f.width, 21);
            assert.equal(f.height, 42);
        });

        it('accepts action to specify font pixel', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('font-px-specified', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateFontPx(144));
            assert.isTrue(flag, 'font-px-specified event was not fired');
            assert.equal(s.font_attr.specified_px, 144);
        });

        it('accepts action to font face', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('font-face-specified', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateFontFace('Meiryo'));
            assert.isTrue(flag, 'font-face-specified event was not fired');
            assert.equal(s.font_attr.face, 'Meiryo');
        });

        it('accespts action to update screen size', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('update-screen-size', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateScreenSize(400, 300));
            assert.isTrue(flag, 'update-screen-size event was not fired');
            assert.equal(s.size.width, 400);
            assert.equal(s.size.height, 300);

            flag = false;
            s.dispatcher.dispatch(A.updateScreenSize(400, 300));
            assert.isFalse(flag, 'unexpected update-screen-size event');
        });

        it('accespts action to update screen bounds', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('update-screen-bounds', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateScreenBounds(42, 84));
            assert.isTrue(flag, 'update-screen-bounds event was not fired');
            assert.equal(s.size.lines, 42, 'lines was not set');
            assert.equal(s.size.cols, 84, 'cols was not set');
            assert.deepEqual(s.scroll_region, {
                top: 0,
                left: 0,
                right: 83,
                bottom: 41
            });

            flag = false;
            s.dispatcher.dispatch(A.resize(42, 84));
            assert.isFalse(flag, 'update-screen-bounds event was wrongly fired');
        });

        it('handles mouse_on event', () => {
            const s = new NeovimStore();
            s.mouse_enabled = false;
            var flag = false;
            s.on('mouse-enabled', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.enableMouse());
            assert.isTrue(flag, 'mouse-enabled event was not fired');
            assert.isTrue(s.mouse_enabled, 'mouse did not set enabled');
            flag = false;
            s.dispatcher.dispatch(A.enableMouse());
            assert.isFalse(flag, 'mouse-enabled event was fired even if mouse_enabled state had been not changed');
        });

        it('handles mouse_off event', () => {
            const s = new NeovimStore();
            s.mouse_enabled = true;
            var flag = false;
            s.on('mouse-disabled', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.disableMouse());
            assert.isTrue(flag, 'mouse-disabled event was not fired');
            assert.isFalse(s.mouse_enabled, 'mouse did not set disabled');
            flag = false;
            s.dispatcher.dispatch(A.disableMouse());
            assert.isFalse(flag, 'mouse-disabled event was fired even if mouse_enabled state had been not changed');
        });

        it('accepts drag start action', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('drag-started', () => {
                flag = true;
            });
            const e = document.createEvent('MouseEvent');
            e.initEvent('mousedown', true, false);
            s.dispatcher.dispatch(A.dragStart(e));
            assert.isTrue(flag, 'drag-started event was not fired');
            assert.isNotNull(s.dragging, 'store.dragging must be created');

            s.mouse_enabled = false;
            flag = false;
            s.dispatcher.dispatch(A.dragStart(e));
            assert.isFalse(flag, 'drag-started event should not be fired while mouse is disabled');
        });

        it('accepts drag update action', () => {
            const s = new NeovimStore();
            const down = document.createEvent('MouseEvent');
            down.initEvent('mousedown', true, false);
            down.buttons = 1;
            s.dispatcher.dispatch(A.dragStart(down));

            var updated = false;
            s.on('drag-updated', () => {
                updated = true;
            });
            var input = false;
            s.on('input', i => {
                assert.notEqual(i, '');
                input = true;
            });

            var move = document.createEvent('MouseEvent');
            move.initEvent('mousemove', true, false);
            move.buttons = 1;
            s.dispatcher.dispatch(A.dragUpdate(move));
            assert.isTrue(updated, 'drag-updated event was not fired');
            assert.isTrue(input, 'input event was not fired');
            assert.isNotNull(s.dragging, 'store.dragging must be maintained');

            s.mouse_enabled = false;
            updated = false;
            move = document.createEvent('MouseEvent');
            move.initEvent('mousemove', true, false);
            move.buttons = 1;
            s.dispatcher.dispatch(A.dragUpdate(move));
            assert.isFalse(updated, 'drag updated event must not be fired while mouse disabled');

            s.mouse_enabled = true;
            s.dragging = null;
            updated = false;
            move = document.createEvent('MouseEvent');
            move.initEvent('mousemove', true, false);
            move.buttons = 1;
            s.dispatcher.dispatch(A.dragUpdate(move));
            assert.isFalse(updated, 'drag updated event must not be fired without drag start event');
        });

        it('accepts drag end action', () => {
            const s = new NeovimStore();
            const down = document.createEvent('MouseEvent');
            down.initEvent('mousedown', true, false);
            down.buttons = 1;
            s.dispatcher.dispatch(A.dragStart(down));

            var ended = false;
            s.on('drag-ended', () => {
                ended = true;
            });
            var input = false;
            s.on('input', i => {
                assert.notEqual(i, '');
                input = true;
            });

            var up = document.createEvent('MouseEvent');
            up.initEvent('mouseup', true, false);
            up.buttons = 1;
            s.dispatcher.dispatch(A.dragEnd(up));
            assert.isTrue(ended, 'drag-ended event was not fired');
            assert.isTrue(input, 'input event was not fired');
            assert.isNull(s.dragging, 'store.dragging must be cleared');

            s.mouse_enabled = false;
            ended = false;
            up = document.createEvent('MouseEvent');
            up.initEvent('mouseup', true, false);
            up.buttons = 1;
            s.dispatcher.dispatch(A.dragUpdate(up));
            assert.isFalse(ended, 'drag end event must not be fired while mouse disabled');

            s.mouse_enabled = true;
            s.dragging = null;
            ended = false;
            up = document.createEvent('MouseEvent');
            up.initEvent('mousemove', true, false);
            up.buttons = 1;
            s.dispatcher.dispatch(A.dragUpdate(up));
            assert.isFalse(ended, 'drag updated event must not be fired without drag start event');
        });

        it('handles beep event', () => {
            const s = new NeovimStore();

            var flag = false;
            s.on('beep', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.bell(false));
            assert.isTrue(flag, 'beep event was not fired');

            flag = false;
            s.on('visual-bell', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.bell(true));
            assert.isTrue(flag, 'visual-beep event was not fired');
        });

        it('handles title-changed event', () => {
            const s = new NeovimStore();

            var flag = false;
            s.on('title-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.setTitle('This is that'));
            assert.isTrue(flag, 'title-changed event was not fired');
            assert.equal(s.title, 'This is that');
        });

        it('handles set_icon event', () => {
            const s = new NeovimStore();

            var flag = false;
            s.on('icon-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.setIcon('This is that'));
            assert.isTrue(flag, 'icon-changed event was not fired');
            assert.equal(s.icon_path, 'This is that');
        });

        // Skip because creating WheelEvent is not supported by jsdom
        it.skip('accepts wheel scrolling action', () => {
            const s = new NeovimStore();

            var wheeled = false;
            s.on('wheel-scrolled', () => {
                wheeled = true;
            });
            var input = false;
            s.on('input', i => {
                assert.notEqual(i, '');
                input = true;
            });

            var wheel = document.createEvent('WheelEvent');
            wheel.initEvent('wheel', true, false);
            wheel.buttons = 1;
            s.dispatcher.dispatch(A.wheelScroll(wheel));
            assert.isTrue(wheeled, 'wheel-scrolled event was not fired');
            assert.isTrue(input, 'input event was not fired');

            wheeled = false;
            s.mouse_enabled = false;
            s.dispatcher.dispatch(A.wheelScroll(wheel));
            assert.isFalse(wheeled, 'wheel-scrolled event must not be fired while mouse disabled');
        });

        it('accepts line_height changing event', () => {
            const s = new NeovimStore();

            var flag = false;
            s.on('line-height-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.updateLineHeight(1.5));
            assert.isTrue(flag, 'line-height-changed event was not fired');
            assert.equal(s.line_height, 1.5);

            flag = false;
            s.dispatcher.dispatch(A.updateLineHeight(1.5));
            assert.isFalse(flag, 'line-height-changed event was fired although line height value is not changed');
            assert.equal(s.line_height, 1.5);
        });

        it('accepts disabling alt key event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('alt-key-disabled', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.disableAltKey(true));
            assert.isTrue(flag, 'alt-key-disabled event was not fired');
            assert.equal(s.alt_key_disabled, true);
        });

        it('switches to disable/enable meta key', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('meta-key-disabled', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.disableMetaKey(true));
            assert.isTrue(flag, 'meta-key-disabled event was not fired');
            assert.equal(s.meta_key_disabled, true);
            s.dispatcher.dispatch(A.disableMetaKey(false));
            assert.equal(s.meta_key_disabled, false);
        });

        it('accepts cursor draw delay change event', () => {
            const s = new NeovimStore();
            var flag = false;
            s.on('cursor-draw-delay-changed', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.changeCursorDrawDelay(0));
            assert.isTrue(flag, 'cursor-draw-delay-changed event was not fired');
            assert.equal(s.cursor_draw_delay, 0);
        });

        it('accepts cursor blinking event', () => {
            const s = new NeovimStore();
            var flag = false;

            s.on('blink-cursor-stopped', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.startBlinkCursor());
            s.dispatcher.dispatch(A.stopBlinkCursor());
            assert.isTrue(flag, 'blink-cursor-stopped event was not fired');
            flag = false;
            s.dispatcher.dispatch(A.stopBlinkCursor());
            assert.isFalse(flag, 'blink-cursor-stopped event was incorrectly fired because cursor blinking state did not change');

            flag = false;
            s.on('blink-cursor-started', () => {
                flag = true;
            });
            s.dispatcher.dispatch(A.startBlinkCursor());
            assert.isTrue(flag, 'blink-cursor-started event was not fired');
            flag = false;
            s.dispatcher.dispatch(A.startBlinkCursor());
            assert.isFalse(flag, 'blink-cursor-started event was incorrectly fired because cursor blinking state did not change');
        });
    });
});
