export default class NeovimScreen {
    context: CanvasRenderingContext2D;
    lines: number;
    columns: number;

    constructor(
            public canvas: HTMLCanvasElement,
            width: number,
            height: number,
            public font_size: number
        ) {
        if (width) {
            canvas.style.width = width + 'px';
        }
        if (height) {
            canvas.style.height = height + 'px';
        }
    }

    initializeCanvas() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        console.log(w, h);
        this.lines = Math.floor(h / this.font_size);
        this.columns = Math.floor(w / (this.font_size / 2));
    }
}
