import {EventEmitter} from 'events';
import NeovimStore from './store';
import log from '../log';
import {dragEnd} from './actions';

function guessColors(image: ImageData) {
    'use strict';
    const d = image.data;
    const colors = [] as [number, number[]][];

    LOOP:
    for (let i = 0; i < d.length; i+=4) {
        const r = d[0], g = d[1], b = d[2];
        for (let idx in colors) {
            const c = colors[idx][1];
            if (c[0] === r && c[1] === g && c[2] === b) {
                colors[idx][0] += 1;
                continue LOOP;
            }
        }
        colors.push([1, [r, g, b]]);
    }

    return colors
        .sort((l, r) => l[0] - r[0])
        .slice(colors.length - 2)
        .map(c => c[1]);
}

function maskFgBg(image: ImageData) {
    'use strict';
    const d = image.data;
    const guessed = guessColors(image);
    if (guessed.length === 1) {
        // Note: Fall back
        guessed.push([
            255 - guessed[0][0],
            255 - guessed[0][1],
            255 - guessed[0][2],
        ]);
    }

    for (let i = 0; i < d.length; i+=4) {
        const r = d[i], g = d[i+1], b = d[i+2];

        if (guessed[0][0] === r &&
            guessed[0][1] === g &&
            guessed[0][2] === b) {

            d[i] = guessed[1][0];
            d[i+1] = guessed[1][1];
            d[i+2] = guessed[1][2];

        } else {

            // Note:
            // guessed[0] appears more frequently than guessed[1].
            // So we should guess guessed[0] is a backgroundcolor.

            d[i] = guessed[0][0];
            d[i+1] = guessed[0][1];
            d[i+2] = guessed[0][2];

        }
    }

    return image;
}

class CursorBlinkTimer extends EventEmitter {
    enabled: boolean;
    shown: boolean;
    private token: number;
    private callback: () => void;

    constructor(public interval: number) {
        super();
        this.token = null;
        this.enabled = false;
        this.shown = true;
        this.callback = this._callback.bind(this);
    }

    start() {
        if (this.enabled) {
            return;
        }
        this.shown = true;
        this.token = window.setTimeout(this.callback, this.interval);
        this.enabled = true;
    }

    stop() {
        if (!this.enabled) {
            return;
        }
        if (this.token !== null) {
            window.clearTimeout(this.token);
            this.token = null;
        }
        this.enabled = false;
    }

    reset() {
        if (this.enabled) {
            this.stop();
            this.start();
        }
    }

    private _callback() {
        this.shown = !this.shown;
        this.emit('tick', this.shown);
        this.token = window.setTimeout(this.callback, this.interval);
    }
}

export default class NeovimCursor {
    private element: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private delay_timer: number;
    private blink_timer: CursorBlinkTimer;

    constructor(private store: NeovimStore, private screen_ctx: CanvasRenderingContext2D) {
        this.delay_timer = null;
        this.blink_timer = new CursorBlinkTimer(this.store.cursor_blink_interval);
        this.element = document.querySelector('.neovim-cursor') as HTMLCanvasElement;
        this.element.style.top = '0px';
        this.element.style.left = '0px';
        this.ctx = this.element.getContext('2d');
        this.updateSize();
        this.blink_timer.on('tick', (shown: boolean) => {
            if (shown) {
                this.redraw();
            } else {
                this.dismiss();
            }
        });
        if (this.store.blink_cursor) {
            this.blink_timer.start();
        }

        this.element.addEventListener('mouseup', (e: MouseEvent) => {
            this.store.dispatcher.dispatch(dragEnd(e));
        });
        this.element.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            const i = document.querySelector('.neovim-input') as HTMLInputElement;
            if (i) {
                i.focus();
            }
        });

        this.store.on('cursor', this.updateCursorPos.bind(this));
        this.store.on('update-fg', () => this.redraw());
        this.store.on('font-size-changed', this.updateSize.bind(this));
        this.store.on('blink-cursor-started', () => this.blink_timer.start());
        this.store.on('blink-cursor-stopped', () => this.blink_timer.stop());
        this.store.on('busy', () => {
            if (this.store.busy) {
                this.dismiss();
                this.blink_timer.stop();
            } else {
                this.redraw();
                if (this.store.blink_cursor) {
                    this.blink_timer.start();
                }
            }
        });
        this.store.on('focus-changed', () => this.updateCursorBlinking(this.store.focused));
        this.store.on('mode', () => this.updateCursorBlinking(this.store.mode !== 'insert'));
    }

    updateSize() {
        const f = this.store.font_attr;
        this.element.style.width = f.width + 'px';
        this.element.style.height = f.height + 'px';
        this.element.width = f.draw_width;
        this.element.height = f.draw_height;
        this.redraw();
    }

    dismiss() {
        this.ctx.clearRect(0, 0, this.element.width, this.element.height);
    }

    redraw() {
        if (this.store.cursor_draw_delay <= 0) {
            this.redrawImpl();
            return;
        }
        if (this.delay_timer !== null) {
            clearTimeout(this.delay_timer);
        } else {
            this.ctx.clearRect(0, 0, this.element.width, this.element.height);
        }
        this.delay_timer = setTimeout(this.redrawImpl.bind(this), this.store.cursor_draw_delay);
    }

    updateCursorPos() {
        const {line, col} = this.store.cursor;
        const {width, height} = this.store.font_attr;

        const x = col * width;
        const y = line * height;

        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        log.debug(`Cursor is moved to (${x}, ${y})`);
        this.redraw();
        this.blink_timer.reset();
    }

    private redrawImpl() {
        this.delay_timer = null;
        if (this.store.mode === 'insert') {
            this.ctx.fillStyle = this.store.fg_color;
            this.ctx.fillRect(0, 0, window.devicePixelRatio || 1, this.store.font_attr.draw_height);
        } else {
            const cursor_width = this.store.font_attr.draw_width;
            const cursor_height = this.store.font_attr.draw_height;
            const x = this.store.cursor.col * this.store.font_attr.draw_width;
            const y = this.store.cursor.line * this.store.font_attr.draw_height;
            const captured = this.screen_ctx.getImageData(x, y, cursor_width, cursor_height);
            this.ctx.putImageData(maskFgBg(captured), 0, 0);
        }
    }

    private updateCursorBlinking(should_blink: boolean) {
        if (should_blink) {
            if (this.store.blink_cursor) {
                this.blink_timer.start();
            }
        } else {
            this.blink_timer.stop();
            if (!this.blink_timer.shown) {
                this.redraw();
            }
        }
    }
}
