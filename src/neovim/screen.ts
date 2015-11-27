import Store from './store';
import Dispatcher from './dispatcher';
import {updateFontPx, updateFontSize, focus, updateScreenSize, updateScreenBounds} from './actions';

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;

    constructor(public canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d');

        Store.on('put', this.drawText.bind(this));
        Store.on('clear-all', this.clearAll.bind(this));
        Store.on('clear-eol', this.clearEol.bind(this));
        // Note: 'update-bg' clears all texts in screen.
        Store.on('update-bg', this.clearAll.bind(this));

        // TODO:
        // Watch 'resize' event from neovim

        this.updateActualFontSize(Store.font_attr.specified_px);

        canvas.addEventListener('click', this.focus.bind(this));
    }

    resizeScreen(width: number, height: number) {
        if (width !== this.canvas.width) {
            this.canvas.width = width;
        }
        if (height !== this.canvas.height) {
            this.canvas.height = height;
        }
        Dispatcher.dispatch(updateScreenSize(width, height));

        const lines = Math.floor(height / Store.font_attr.height);
        const columns = Math.floor(width / Store.font_attr.width);
        Dispatcher.dispatch(updateScreenBounds(lines, columns));
    }

    updateActualFontSize(specified_px: number) {
        this.ctx.font = specified_px + 'px ' + Store.font_attr.face;
        const font_width = this.ctx.measureText('m').width;
        const font_height = font_width * 2;
        Dispatcher.dispatch(updateFontPx(specified_px));
        Dispatcher.dispatch(updateFontSize(font_width, font_height));
        this.resizeScreen(Store.size.width, Store.size.height);
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
        const clear_length = Store.size.cols * width - col * width;
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

