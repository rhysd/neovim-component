import {EventEmitter} from 'events';
import NeovimStore from './store';
import log from '../log';
import {dragEnd} from './actions';

function invertColor(image: ImageData) {
    const d = image.data;
    for (let i = 0; i < d.length; i+=4) {
        d[i] = 255 - d[i];     // Red
        d[i+1] = 255 - d[i+1]; // Green
        d[i+2] = 255 - d[i+2]; // Blue
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
        this.ctx = this.element.getContext('2d', {alpha: false});
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
        const cursor_width = this.store.mode.endsWith('insert') ? (window.devicePixelRatio || 1) : this.store.font_attr.draw_width;
        const cursor_height = this.store.font_attr.draw_height;
        const x = this.store.cursor.col * this.store.font_attr.draw_width;
        const y = this.store.cursor.line * this.store.font_attr.draw_height;
        const captured = this.screen_ctx.getImageData(x, y, cursor_width, cursor_height);
        this.ctx.putImageData(invertColor(captured), 0, 0);
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
