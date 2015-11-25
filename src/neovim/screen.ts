import Store, {Cursor, FontAttributes} from './store';
import Dispatcher from './dispatcher';
import {updateFontSize, focus} from './actions';

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;
    lines: number;
    columns: number;

    constructor(public canvas: HTMLCanvasElement, public specifed_font_px: number) {
        this.ctx = this.canvas.getContext('2d');

        Store.on('put', this.drawText.bind(this));
        Store.on('clear-all', this.clearAll.bind(this));

        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;

        this.ctx.font = this.specifed_font_px + 'px monospace'; // TODO: Enable to specify font
        const font_width = this.ctx.measureText('m').width;
        const font_height = font_width * 2;

        Dispatcher.dispatch(updateFontSize(font_width, font_height));

        this.lines = Math.floor(h / font_height);
        this.columns = Math.floor(w / font_width);

        canvas.addEventListener('click', this.focus.bind(this));
    }

    focus() {
        Dispatcher.dispatch(focus());
    }

    clearAll() {
        this.drawBlock(0, 0, this.lines, this.columns, Store.bg_color);
    }

    clearEol() {
        const {line, col} = Store.cursor;
        const width = Store.font_attr.width;
        const clear_length = this.lines * width - col * width;
        this.drawBlock(line, col, 1, clear_length, Store.bg_color);
    }

    drawText(chars: string[][]) {
        const {line, col} = Store.cursor;
        const {fg, bg, width, height} = Store.font_attr;

        // Draw background
        this.drawBlock(line, col, 1, chars.length, bg);

        // TODO: Enable to specify font
        // TODO: Consider font attributes (e.g. underline, bold, ...)
        this.ctx.font = this.specifed_font_px + 'px monospace';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = fg;
        const text = chars.map(c => (c[0] || '')).join('');
        const x = col * width;
        const y = line * height;
        this.ctx.fillText(text, x, y);
        console.log(`drawText(): (${x}, ${y})`, JSON.stringify(text), Store.cursor);
    }

    drawBlock(line: number, col: number, height: number, width: number, color: string) {
        const attr = Store.font_attr;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
                col * attr.width,
                line * attr.height,
                Math.ceil(width * attr.width),
                Math.ceil(height * attr.height)
            );
    }
}

