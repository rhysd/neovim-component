import NeovimStore from './store';
import log from '../log';

// Note: Mouse has its origin at left-bottom
//
//   +y
//    |
//    |
//    |
//    |
//    |--------- +x

// Note:
// Vim handles scroll with 3 lines and 6 columns as one scroll
// :help <ScrollWheelUp>

export default class ScreenWheel {
    x: number;
    y: number;
    shift: boolean;
    ctrl: boolean;

    constructor(private store: NeovimStore) {
        this.reset();
    }

    handleEvent(e: WheelEvent) {
        if ((this.shift === undefined && this.ctrl === undefined) ||
            (this.shift !== e.shiftKey || this.ctrl !== e.ctrlKey)) {
            // Note:
            // Initialize at first or reset on modifier change
            this.reset(e.shiftKey, e.ctrlKey);
        }

        this.x += e.deltaX;
        this.y += e.deltaY;

        const scroll_x = Math.round(this.x / this.store.font_attr.draw_width / 6);
        const scroll_y = Math.round(this.y / this.store.font_attr.draw_height / 3);

        if (scroll_x === 0 && scroll_y === 0) {
            // Note: At least 3 lines or 6 columns are needed to scroll screen
            return '';
        }

        const col  = Math.floor(e.offsetX / this.store.font_attr.width);
        const line = Math.floor(e.offsetY / this.store.font_attr.height);

        const input = this.getInput(scroll_x, scroll_y, line, col);
        log.debug(`Scroll (${scroll_x}, ${scroll_y}) at (${line}, ${col}): ${input}`);
        this.reset();
        return input;
    }

    private reset(shift?: boolean, ctrl?: boolean) {
        this.x = 0;
        this.y = 0;
        this.shift = shift;
        this.ctrl = ctrl;
    }

    private getInput(scroll_x: number, scroll_y: number, line: number, col: number) {
        const pos = `<${col},${line}>`;
        let modifier = '<';
        if (this.ctrl) {
            modifier += 'C-';
        }
        if (this.shift) {
            modifier += 'S-';
        }

        let seq = '';

        const y_dir = scroll_y > 0 ? 'Down' : 'Up';
        for (let _ = 0; _ < Math.abs(scroll_y); ++_) {
            seq += `${modifier}ScrollWheel${y_dir}>${pos}`;
        }

        const x_dir = scroll_x > 0 ? 'Left' : 'Right';
        for (let _ = 0; _ < Math.abs(scroll_x); ++_) {
            seq += `${modifier}ScrollWheel${x_dir}>${pos}`;
        }

        return seq;
    }
}
