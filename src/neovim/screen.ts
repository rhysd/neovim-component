import Store, {Cursor} from './store';

interface Font {
    width: number;
    height: number;
    fg: string;
    bg: string;
}


// function handlePut(lines: Immutable.List<string>, cursor_line: number, cursor_col: number, chars: string[][]) {
//     const prev_line = lines.get(cursor_line) || '';
//     let next_line = prev_line.substring(0, cursor_col);
//     if (next_line.length < cursor_col) {
//         next_line += ' '.repeat(cursor_col - next_line.length);
//     }
//     for (const c of chars) {
//         if (c.length !== 1) {
//             console.log('Invalid character: ', c);
//         }
//         next_line += c[0];
//     }
//     if (cursor_col + chars.length < prev_line.length) {
//         next_line += prev_line.substring(cursor_col + chars.length);
//     }
//     return lines.set(cursor_line, next_line);
// }


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
        this.ctx.font = this.font.height + 'px monospace'; // TODO: Enable to specify font

        Store.on('put', this.drawText.bind(this));
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

    drawText(chars: string[][], cursor: Cursor) {
        // Draw background
        this.drawBlock(cursor.line, cursor.col, 1, chars.length, this.font.bg);

        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.font.fg;
        const text = chars.map(c => c[0] || '').join('');
        const x = cursor.col * this.font.width;
        const y = cursor.line * this.font.height;
        this.ctx.fillText(text, x, y);
        console.log(`drawText(): (${x}, ${y})`, text, cursor);
    }

    drawBlock(line: number, col: number, height: number, width: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
                col * this.font.width,
                line * this.font.height,
                width * this.font.width,
                height * this.font.height
            );
    }
}
