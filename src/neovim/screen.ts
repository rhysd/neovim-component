import Store, {Cursor, FontAttributes} from './store';

interface Font {
    width: number;
    height: number;
    fg: string;
    bg: string;
}

export default class NeovimScreen {
    ctx: CanvasRenderingContext2D;
    lines: number;
    columns: number;
    font: Font;

    constructor(public canvas: HTMLCanvasElement, font_size: number) {
        this.font = {
            width: font_size / 2,
            height: font_size,
            fg: 'white',
            bg: 'black',
        };
        this.ctx = this.canvas.getContext('2d');

        Store.on('put', this.drawText.bind(this));
        Store.on('clear-all', this.clearAll.bind(this));
    }

    clearAll(bg_color: string) {
        this.drawBlock(0, 0, this.lines, this.columns, bg_color);
    }

    clearEol(cursor: Cursor, bg_color: string) {
        const clear_length = this.lines * this.font.width - cursor.col * this.font.width;
        this.drawBlock(cursor.line, cursor.col, 1, clear_length, bg_color);
    }

    initializeCanvas() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;

        this.font.width = this.ctx.measureText('m').width;
        this.font.height = this.font.width * 2;

        this.lines = Math.floor(h / this.font.height);
        this.columns = Math.floor(w / this.font.width);

        this.drawBlock(0, 0, this.lines, this.columns, this.font.bg);
    }

    drawText(chars: string[][], cursor: Cursor, attr: FontAttributes) {
        // Draw background
        this.drawBlock(cursor.line, cursor.col, 1, chars.length, attr.bg);

        this.ctx.font = this.font.height + 'px monospace'; // TODO: Enable to specify font
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = attr.fg;
        const text = chars.map(c => c[0] || '').join('');
        const x = cursor.col * this.font.width;
        const y = cursor.line * this.font.height;
        this.ctx.fillText(text, x, y);
        console.log(`drawText(): (${x}, ${y})`, JSON.stringify(text), cursor);
    }

    drawBlock(line: number, col: number, height: number, width: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
                col * this.font.width,
                line * this.font.height,
                Math.ceil(width * this.font.width),
                Math.ceil(height * this.font.height)
            );
    }
}

