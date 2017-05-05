import NeovimStore from './store';
import * as A from './actions';
import Cursor from './cursor';
import Input from './input';
import log from '../log';

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;
    cursor: Cursor;
    input: Input;

    constructor(private store: NeovimStore, public canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d', {alpha: false});

        this.store.on('put', this.drawText.bind(this));
        this.store.on('clear-all', this.clearAll.bind(this));
        this.store.on('clear-eol', this.clearEol.bind(this));
        // Note: 'update-bg' clears all texts in screen.
        this.store.on('update-bg', this.clearAll.bind(this));
        this.store.on('screen-scrolled', this.scroll.bind(this));
        this.store.on(
            'line-height-changed',
            () => this.changeFontSize(this.store.font_attr.specified_px),
        );

        this.changeFontSize(this.store.font_attr.specified_px);

        canvas.addEventListener('click', this.focus.bind(this));
        canvas.addEventListener('mousedown', this.mouseDown.bind(this));
        canvas.addEventListener('mouseup', this.mouseUp.bind(this));
        canvas.addEventListener('mousemove', this.mouseMove.bind(this));
        canvas.addEventListener('wheel', this.wheel.bind(this));

        this.cursor = new Cursor(this.store, this.ctx);
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
        const h = height_px * (window.devicePixelRatio || 1);
        const w = width_px * (window.devicePixelRatio || 1);
        this.resizeImpl(
                Math.floor(h / this.store.font_attr.draw_height),
                Math.floor(w / this.store.font_attr.draw_width),
                w,
                h,
            );
    }

    resize(lines: number, cols: number) {
        this.resizeImpl(
                lines,
                cols,
                this.store.font_attr.draw_width * cols,
                this.store.font_attr.draw_height * lines,
            );
    }

    changeFontSize(specified_px: number) {
        const drawn_px = specified_px * (window.devicePixelRatio || 1);
        this.ctx.font = drawn_px + 'px ' + this.store.font_attr.face;
        const font_width = this.ctx.measureText('m').width;
        // Note1:
        // Line height of <canvas> is fixed to 1.2 (normal).
        // If the specified line height is not 1.2, we should calculate
        // the line height manually.
        //
        // Note2:
        // font_width is not passed to Math.ceil() because the line-height
        // of <canvas> is fixed to 1.2.  Math.ceil(font_width) makes region
        // wider but width of actual rendered text is not changed.  Then it
        // causes rendering issues.
        // On the other hand, line-height is managed by us completely.  So
        // we can use Math.ceil(font_height) at this point and it resolves
        // some rendering issues (see #12).
        const font_height = Math.ceil(
            this.store.line_height === 1.2 ?
                font_width * 2 :
                drawn_px * this.store.line_height,
        );
        this.store.dispatcher.dispatch(A.updateFontPx(specified_px));
        this.store.dispatcher.dispatch(
            A.updateFontSize(
                font_width,
                font_height,
                font_width / (window.devicePixelRatio || 1),
                font_height / (window.devicePixelRatio),
            ),
        );
        const {width, height} = this.store.size;
        this.resizeWithPixels(width, height);
    }

    changeLineHeight(new_value: number) {
        this.store.dispatcher.dispatch(A.updateLineHeight(new_value));
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
        const {width, height} = this.store.font_attr;
        return {
            x: col * width,
            y: line * height,
        };
    }
    convertLocationToPosition(x: number, y: number) {
        const {width, height} = this.store.font_attr;
        return {
            line: Math.floor(y * height),
            col: Math.floor(x * width),
        };
    }

    checkShouldResize() {
        const p = this.canvas.parentElement;
        const cw = p.clientWidth;
        const ch = p.clientHeight;
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (cw * (window.devicePixelRatio || 1) !== w ||
            ch * (window.devicePixelRatio || 1) !== h) {
            this.resizeWithPixels(cw, ch);
        }
    }

    // Note:
    // About 'chars' parameter includes characters to render as array of strings
    // which should be rendered at the each cursor position.
    // So we renders the strings with forwarding the start position incrementally.
    // When chars[idx][0] is empty string, it means that 'no character to render,
    // go ahead'.
    private drawChars(x: number, y: number, chars: string[][], width: number) {
        let includes_half_only = true;
        for (const c of chars) {
            if (!c[0]) {
                includes_half_only = false;
                break;
            }
        }
        if (includes_half_only) {
            // Note:
            // If the text includes only half characters, we can render it at once.
            const text = chars.map(c => (c[0] || '')).join('');
            this.ctx.fillText(text, x, y);
            return;
        }

        for (const char of chars) {
            if (!char[0] || char[0] === ' ') {
                x += width;
                continue;
            }
            this.ctx.fillText(char.join(''), x, y);
            x += width;
        }
    }

    private drawText(chars: string[][]) {
        const {line, col} = this.store.cursor;
        const {
            fg, bg, sp,
            draw_width,
            draw_height,
            face,
            specified_px,
            bold,
            italic,
            underline,
            undercurl,
        } = this.store.font_attr;

        // Draw background
        this.drawBlock(line, col, 1, chars.length, bg);
        const font_size = specified_px * (window.devicePixelRatio || 1);

        let attrs = '';
        if (bold) {
            attrs += 'bold ';
        }
        if (italic) {
            attrs += 'italic ';
        }
        this.ctx.font = attrs + font_size + 'px ' + face;
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = fg;
        // Note:
        // Line height of <canvas> is fixed to 1.2 (normal).
        // If the specified line height is not 1.2, we should calculate
        // the difference of margin-bottom of text.
        const margin = font_size * (this.store.line_height - 1.2) / 2;
        const y = Math.floor(line * draw_height + margin);
        const x = col * draw_width;
        this.drawChars(x, y, chars, draw_width);
        if (undercurl) {
            this.ctx.strokeStyle = sp || this.store.sp_color || fg; // Note: Fallback for Neovim 0.1.4 or earlier.
            this.ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
            this.ctx.setLineDash([draw_width / 3, draw_width / 3]);
            this.ctx.beginPath();
            const curl_y = y + draw_height - 3 * (window.devicePixelRatio || 1);
            this.ctx.moveTo(x, curl_y);
            this.ctx.lineTo(x + draw_width * chars.length, curl_y);
            this.ctx.stroke();
        } else if (underline) {
            this.ctx.strokeStyle = fg;
            this.ctx.lineWidth = 1 * (window.devicePixelRatio || 1);
            this.ctx.setLineDash([]);
            this.ctx.beginPath();
            // Note:
            // 3 is set with considering the width of line.
            const underline_y = y + draw_height - 3 * (window.devicePixelRatio || 1);
            this.ctx.moveTo(x, underline_y);
            this.ctx.lineTo(x + draw_width * chars.length, underline_y);
            this.ctx.stroke();
        }
        log.debug(`drawText(): (${x}, ${y})`, chars.length, this.store.cursor);
    }

    private drawBlock(line: number, col: number, height: number, width: number, color: string) {
        const {draw_width, draw_height} = this.store.font_attr;
        this.ctx.fillStyle = color;
        // Note:
        // Height doesn't need to be truncated (floor, ceil) but width needs.
        // The reason is desribed in Note2 of changeFontSize().
        this.ctx.fillRect(
                Math.floor(col * draw_width),
                line * draw_height,
                Math.ceil(width * draw_width),
                height * draw_height,
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
                height * draw_height,
            );
        this.ctx.putImageData(
            captured,
            left * draw_width,
            dst_top * draw_height,
        );
    }

    private scrollUp(cols_up: number) {
        const {top, bottom, left, right} = this.store.scroll_region;
        this.slideVertical(
            top + cols_up,
            bottom - (top + cols_up) + 1,
            top,
        );
        this.drawBlock(
            bottom - cols_up + 1,
            left,
            cols_up,
            right - left + 1,
            this.store.bg_color,
        );
        log.debug('Scroll up: ' + cols_up, this.store.scroll_region);
    }

    private scrollDown(cols_down: number) {
        const {top, bottom, left, right} = this.store.scroll_region;
        this.slideVertical(
            top,
            bottom - (top + cols_down) + 1,
            top + cols_down,
        );
        this.drawBlock(
            top,
            left,
            cols_down,
            right - left + 1,
            this.store.bg_color,
        );
        log.debug('Scroll down: ' + cols_down, this.store.scroll_region);
    }

    private resizeImpl(lines: number, cols: number, width: number, height: number) {
        if (width !== this.canvas.width) {
            this.canvas.width = width;
            this.canvas.style.width = (width / (window.devicePixelRatio || 1)) + 'px';
        }
        if (height !== this.canvas.height) {
            this.canvas.height = height;
            this.canvas.style.height = (height / (window.devicePixelRatio || 1)) + 'px';
        }
        this.store.dispatcher.dispatch(A.updateScreenSize(width, height));
        this.store.dispatcher.dispatch(A.updateScreenBounds(lines, cols));
    }
}

