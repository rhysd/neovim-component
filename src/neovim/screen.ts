import Store from './store';
import Dispatcher from './dispatcher';
import {updateFontSize, focus} from './actions';

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;
    lines: number;
    columns: number;

    constructor(public canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d');

        Store.on('put', this.drawText.bind(this));
        Store.on('clear-all', this.clearAll.bind(this));
        Store.on('clear-eol', this.clearEol.bind(this));
        Store.on('font-px-specified', this.updateActualFontSize.bind(this));
        // Note: 'update-bg' clears all texts in screen.
        Store.on('update-bg', this.clearAll.bind(this));

        this.updateActualFontSize();

        canvas.addEventListener('click', this.focus.bind(this));
    }

    updateActualFontSize() {
        this.ctx.font = Store.font_attr.specified_px + 'px ' + Store.font_attr.face;
        const font_width = this.ctx.measureText('m').width;
        const font_height = font_width * 2;

        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.lines = Math.floor(h / font_height);
        this.columns = Math.floor(w / font_width);

        // TODO: Call vim_try_resize Neovim API to resize backend screen

        Dispatcher.dispatch(updateFontSize(font_width, font_height));
    }

    focus() {
        Dispatcher.dispatch(focus());
    }

    clearAll() {
        this.ctx.fillStyle = Store.font_attr.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearEol() {
        const {line, col} = Store.cursor;
        const width = Store.font_attr.width;
        const clear_length = this.lines * width - col * width;
        console.log(`Clear until EOL: ${line}:${col} length=${clear_length}`);
        this.drawBlock(line, col, 1, clear_length, Store.font_attr.bg);
    }

    drawText(chars: string[][]) {
        const {line, col} = Store.cursor;
        const {fg, bg, width, height, face, specified_px} = Store.font_attr;

        // Draw background
        this.drawBlock(line, col, 1, chars.length, bg);

        // TODO: Enable to specify font
        // TODO: Consider font attributes (e.g. underline, bold, ...)
        this.ctx.font = specified_px + 'px ' + face;
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
                Math.floor(col * attr.width),
                Math.floor(line * attr.height),
                Math.ceil(width * attr.width),
                Math.ceil(height * attr.height)
            );
    }
}

