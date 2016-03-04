import NeovimStore from './store';
import log from '../log';
import {dragEnd} from './actions';

function invertColor(image: ImageData) {
    'use strict';
    for (let i = 0; i < image.data.length; i+=4) {
        image.data[i] = 255 - image.data[i];     // Red
        image.data[i+1] = 255 - image.data[i+1]; // Green
        image.data[i+2] = 255 - image.data[i+2]; // Blue
    }
    return image;
}

const DRAW_DELAY = 20; // millisec

export default class NeovimCursor {
    private element: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private timer_id: NodeJS.Timer;

    constructor(private store: NeovimStore, private screen_ctx: CanvasRenderingContext2D) {
        this.timer_id = null;
        this.element = document.querySelector('.neovim-cursor') as HTMLCanvasElement;
        this.element.style.top = '0px';
        this.element.style.left = '0px';
        this.ctx = this.element.getContext('2d');
        this.updateSize();

        this.element.addEventListener('mouseup', (e: MouseEvent) => {
            this.store.dispatcher.dispatch(dragEnd(e));
        });

        this.store.on('cursor', this.updateCursorPos.bind(this));
        this.store.on('update-fg', this.redraw.bind(this));
        this.store.on('font-size-changed', this.updateSize.bind(this));
    }

    updateSize() {
        const f = this.store.font_attr;
        this.element.style.width = f.width + 'px';
        this.element.style.height = f.height + 'px';
        this.element.width = f.draw_width;
        this.element.height = f.draw_height;
        this.redraw();
    }

    redraw() {
        if (this.timer_id !== null) {
            clearTimeout(this.timer_id);
        } else {
            this.ctx.clearRect(0, 0, this.element.width, this.element.height);
        }
        this.timer_id = setTimeout(() => {
            this.timer_id = null;
            const cursor_width = this.store.mode === 'insert' ? (window.devicePixelRatio || 1) : this.store.font_attr.draw_width;
            const cursor_height = this.store.font_attr.draw_height;
            const x = this.store.cursor.col * this.store.font_attr.draw_width;
            const y = this.store.cursor.line * this.store.font_attr.draw_height;
            const captured = this.screen_ctx.getImageData(x, y, cursor_width, cursor_height);
            this.ctx.putImageData(invertColor(captured), 0, 0);
        }, DRAW_DELAY);
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
    }
}
