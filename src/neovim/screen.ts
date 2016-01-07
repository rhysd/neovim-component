import NeovimStore from './store';
import * as A from './actions';
import Cursor from './cursor';
import Input from './input';
import log from '../log';

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;
    cursor: Cursor;
    input: Input;
    pixel_ratio: number;

    constructor(private store: NeovimStore, public canvas: HTMLCanvasElement) {
        this.pixel_ratio = window.devicePixelRatio || 1;
        this.ctx = this.canvas.getContext('2d');

        this.store.on('put', this.drawText.bind(this));
        this.store.on('clear-all', this.clearAll.bind(this));
        this.store.on('clear-eol', this.clearEol.bind(this));
        // Note: 'update-bg' clears all texts in screen.
        this.store.on('update-bg', this.clearAll.bind(this));
        this.store.on('screen-scrolled', this.scroll.bind(this));

        this.changeFontSize(this.store.font_attr.specified_px);

        canvas.addEventListener('click', this.focus.bind(this));
        canvas.addEventListener('mousedown', this.mouseDown.bind(this));
        canvas.addEventListener('mouseup', this.mouseUp.bind(this));
        canvas.addEventListener('mousemove', this.mouseMove.bind(this));
        canvas.addEventListener('wheel', this.wheel.bind(this));

        this.cursor = new Cursor(this.store);
        this.input = new Input(this.store);
    }

    wheel(e: WheelEvent) {
        this.store.dispatcher.dispatch(A.wheelScroll(e));
    }

    mouseDown(e: MouseEvent) {
        this.store.dispatcher.dispatch(A.dragStart(e));
    }

    mouseUp(e: MouseEvent) {
        this.store.dispatcher.dispatch(A.dragEnd(e));
    }

    mouseMove(e: MouseEvent) {
        if (e.buttons !== 0) {
            this.store.dispatcher.dispatch(A.dragUpdate(e));
        }
    }

    resizeWithPixels(width_px: number, height_px: number) {
        const h = height_px * this.pixel_ratio;
        const w = width_px * this.pixel_ratio;
        this.resizeImpl(
                Math.floor(h / this.store.font_attr.draw_height),
                Math.floor(w / this.store.font_attr.draw_width),
                w,
                h
            );
    }

    resize(lines: number, cols: number) {
        this.resizeImpl(
                lines,
                cols,
                this.store.font_attr.draw_width * cols,
                this.store.font_attr.draw_height * lines
            );
    }

    changeFontSize(specified_px: number) {
        const drawn_px = specified_px * this.pixel_ratio
        this.ctx.font = drawn_px + 'px ' + this.store.font_attr.face;
        const font_width = this.ctx.measureText('m').width;
        const font_height = font_width * 2;
        this.store.dispatcher.dispatch(A.updateFontPx(specified_px));
        this.store.dispatcher.dispatch(
            A.updateFontSize(
                font_width,
                font_height,
                font_width / this.pixel_ratio,
                font_height / this.pixel_ratio
            )
        );
        const {width, height} = this.store.size;
        this.resizeWithPixels(width, height);
    }

    // Note:
    //  cols_delta > 0 -> screen up
    //  cols_delta < 0 -> screen down
    scroll(cols_delta: number) {
        if (cols_delta > 0) {
            this.scrollUp(cols_delta);
        } else if (cols_delta < 0) {
            this.scrollDown(-cols_delta);
        }
    }

    focus() {
        this.input.focus();
    }

    clearAll() {
        this.ctx.fillStyle = this.store.bg_color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearEol() {
        const {line, col} = this.store.cursor;
        const font_width = this.store.font_attr.draw_width;
        const clear_length = this.store.size.cols * font_width - col * font_width;
        log.debug(`Clear until EOL: ${line}:${col} length=${clear_length}`);
        this.drawBlock(line, col, 1, clear_length, this.store.bg_color);
    }

    // Origin is at left-above.
    //
    //      O-------------> x
    //      |
    //      |
    //      |
    //      |
    //      V
    //      y
    //
    convertPositionToLocation(line: number, col: number) {
        const {draw_width, draw_height} = this.store.font_attr;
        return {
            x: col * draw_width / this.pixel_ratio,
            y: line * draw_height / this.pixel_ratio,
        };
    }
    convertLocationToPosition(x: number, y: number) {
        const {draw_width, draw_height} = this.store.font_attr;
        return {
            line: Math.floor(y * this.pixel_ratio / draw_height),
            col: Math.floor(x * this.pixel_ratio / draw_width),
        };
    }

    checkShouldResize() {
        const p = this.canvas.parentElement;
        const cw = p.clientWidth;
        const ch = p.clientHeight;
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (cw * this.pixel_ratio !== w ||
            ch * this.pixel_ratio !== h) {
            this.resizeWithPixels(cw, ch);
        }
    }

    private drawText(chars: string[][]) {
        const {line, col} = this.store.cursor;
        const {fg, bg, draw_width, draw_height, face, specified_px} = this.store.font_attr;

        // Draw background
        this.drawBlock(line, col, 1, chars.length, bg);

        // TODO: Consider font attributes (e.g. underline, bold, ...)
        this.ctx.font = (specified_px * this.pixel_ratio) + 'px ' + face;
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = fg;
        const text = chars.map(c => (c[0] || '')).join('');
        const x = col * draw_width;
        const y = line * draw_height;
        this.ctx.fillText(text, x, y);
        log.debug(`drawText(): (${x}, ${y})`, text, this.store.cursor);
    }

    private drawBlock(line: number, col: number, height: number, width: number, color: string) {
        const {draw_width, draw_height} = this.store.font_attr;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
                Math.floor(col * draw_width),
                Math.floor(line * draw_height),
                Math.ceil(width * draw_width),
                Math.ceil(height * draw_height)
            );
    }

    private slideVertical(top: number, height: number, dst_top: number) {
        const {left, right} = this.store.scroll_region;
        const {draw_width, draw_height} = this.store.font_attr;
        const captured
            = this.ctx.getImageData(
                left * draw_width,
                top * draw_height,
                (right - left + 1) * draw_width,
                height * draw_height
            );
        this.ctx.putImageData(
            captured,
            left * draw_width,
            dst_top * draw_height
        );
    }

    private scrollUp(cols_up: number) {
        const {top, bottom, left, right} = this.store.scroll_region;
        this.slideVertical(
            top + cols_up,
            bottom - (top + cols_up) + 1,
            top
        );
        this.drawBlock(
            bottom - cols_up + 1,
            left,
            cols_up,
            right - left + 1,
            this.store.bg_color
        );
        log.debug('Scroll up: ' + cols_up, this.store.scroll_region);
    }

    private scrollDown(cols_down: number) {
        const {top, bottom, left, right} = this.store.scroll_region;
        this.slideVertical(
            top,
            bottom - (top + cols_down) + 1,
            top + cols_down
        );
        this.drawBlock(
            top,
            left,
            cols_down,
            right - left + 1,
            this.store.bg_color
        );
        log.debug('Scroll down: ' + cols_down, this.store.scroll_region);
    }

    private resizeImpl(lines: number, cols: number, width: number, height: number) {
        if (width !== this.canvas.width) {
            this.canvas.width = width;
            this.canvas.style.width = (width / this.pixel_ratio) + 'px';
        }
        if (height !== this.canvas.height) {
            this.canvas.height = height;
            this.canvas.style.height = (height / this.pixel_ratio) + 'px';
        }
        this.store.dispatcher.dispatch(A.updateScreenSize(width, height));
        this.store.dispatcher.dispatch(A.updateScreenBounds(lines, cols));
    }
}

